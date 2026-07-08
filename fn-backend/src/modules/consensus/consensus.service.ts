import { and, asc, eq, ne, notExists, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { appDb } from '../../db';
import { electionResults, sheets, transcriptionEntries } from '../../db/app/schema';
import { sha256Hex } from '../../shared/crypto';
import { isUniqueViolation } from '../../shared/db-errors';
import { AppError } from '../../shared/errors';
import { getRedis } from '../../shared/redis';
import { writeAudit } from '../audit/audit.service';
import { listParties } from '../elections/elections.parties.service';
import { toPublicSheet } from '../upload/upload.service';
import type { ClaimResult, Figures, SubmitEntryInput, SubmitEntryResult } from './consensus.schemas';


const CLAIM_TTL_SECONDS = 30 * 60;
const LOCK_TTL_SECONDS = 15;
const MAX_ENTRIES = 4;

const activeClaimKey = (transcriberId: string): string => `claim:active:${transcriberId}`;
const claimCountKey = (sheetId: string): string => `claim:count:${sheetId}`;
const consensusLockKey = (sheetId: string): string => `lock:consensus:${sheetId}`;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Two transcribers agree if their canonical hashes match. Party keys are sorted so key order can't affect the hash.
export function canonicalFigureHash(figures: Figures): string {
  const parties = Object.keys(figures.partyVotes)
    .sort()
    .map((id) => `${id}:${figures.partyVotes[id]}`)
    .join(',');
  const canonical =
    `av=${figures.accreditedVoters};` +
    `tvv=${figures.totalValidVotes};` +
    `rb=${figures.rejectedBallots};` +
    `tvc=${figures.totalVotesCast};` +
    `pv=${parties}`;
  return sha256Hex(canonical);
}


async function partiesForSheet(electionId: string): Promise<ClaimResult['parties']> {
  return listParties(electionId);
}


export async function claimNextSheet(transcriberId: string): Promise<ClaimResult> {
  const redis = getRedis();

  // Resume a live claim so a reload doesn't strand the transcriber's sheet.
  const active = await redis.get(activeClaimKey(transcriberId));
  if (active) {
    const resumed = await loadClaimable(active, transcriberId);
    if (resumed) {
      await redis.set(activeClaimKey(transcriberId), active, 'EX', CLAIM_TTL_SECONDS);
      return resumed;
    }
    await redis.del(activeClaimKey(transcriberId));
  }

  const mine = alias(transcriptionEntries, 'mine');
  const candidates = await appDb
    .select({
      id: sheets.id,
      electionId: sheets.electionId,
      entryCount: sql<number>`count(${transcriptionEntries.id})::int`,
    })
    .from(sheets)
    .leftJoin(transcriptionEntries, eq(transcriptionEntries.sheetId, sheets.id))
    .where(
      and(
        eq(sheets.status, 'pending'),
        ne(sheets.uploadedBy, transcriberId),
        notExists(
          appDb
            .select({ one: sql`1` })
            .from(mine)
            .where(and(eq(mine.sheetId, sheets.id), eq(mine.transcriberId, transcriberId))),
        ),
      ),
    )
    .groupBy(sheets.id)
    // A pending sheet needs more readings until it has MAX_ENTRIES of them
    .having(sql`count(${transcriptionEntries.id}) < ${MAX_ENTRIES}`)
    .orderBy(sql`count(${transcriptionEntries.id}) asc`, asc(sheets.createdAt))
    .limit(20);

  if (candidates.length === 0) {
    throw new AppError('NO_SHEETS_AVAILABLE', 'No sheets are currently awaiting your transcription.');
  }

  // Fold in soft in-progress claims from Redis and pick the least-loaded sheet.
  const claimCounts = await redis.mget(candidates.map((c) => claimCountKey(c.id)));
  let chosen = candidates[0];
  let chosenLoad = Number.POSITIVE_INFINITY;
  candidates.forEach((c, i) => {
    const load = c.entryCount + (Number(claimCounts[i]) || 0);
    if (load < chosenLoad) {
      chosen = c;
      chosenLoad = load;
    }
  });

  await redis.set(activeClaimKey(transcriberId), chosen.id, 'EX', CLAIM_TTL_SECONDS);
  await redis.incr(claimCountKey(chosen.id));
  await redis.expire(claimCountKey(chosen.id), CLAIM_TTL_SECONDS);

  const claim = await loadClaimable(chosen.id, transcriberId);
  if (!claim) {
    // The sheet resolved between selection and load; try again for another.
    await redis.del(activeClaimKey(transcriberId));
    return claimNextSheet(transcriberId);
  }
  return claim;
}

/** Build a claim payload if the sheet is still pending and unseen by the transcriber. */
async function loadClaimable(
  sheetId: string,
  transcriberId: string,
): Promise<ClaimResult | null> {
  const [sheet] = await appDb.select().from(sheets).where(eq(sheets.id, sheetId)).limit(1);
  if (!sheet || sheet.status !== 'pending' || sheet.uploadedBy === transcriberId) {
    return null;
  }
  const [existing] = await appDb
    .select({ id: transcriptionEntries.id })
    .from(transcriptionEntries)
    .where(
      and(
        eq(transcriptionEntries.sheetId, sheetId),
        eq(transcriptionEntries.transcriberId, transcriberId),
      ),
    )
    .limit(1);
  if (existing) return null;

  return { sheet: toPublicSheet(sheet), parties: await partiesForSheet(sheet.electionId) };
}

export async function submitEntry(
  transcriberId: string,
  input: SubmitEntryInput,
  ip: string | null,
): Promise<SubmitEntryResult> {
  const [sheet] = await appDb
    .select({ id: sheets.id, status: sheets.status, electionId: sheets.electionId, uploadedBy: sheets.uploadedBy })
    .from(sheets)
    .where(eq(sheets.id, input.sheetId))
    .limit(1);
  if (!sheet) {
    throw new AppError('NOT_FOUND', 'Sheet not found.', 'sheetId');
  }
  if (sheet.status !== 'pending') {
    throw new AppError(
      'SHEET_ALREADY_RESOLVED',
      'This sheet has already been verified or disputed and accepts no more entries.',
    );
  }
  // this gives a clean error first.
  if (sheet.uploadedBy === transcriberId) {
    throw new AppError('SELF_TRANSCRIPTION', 'You may not transcribe a sheet you uploaded.');
  }

  const parties = await listParties(sheet.electionId);
  if (parties.length === 0) {
    throw new AppError(
      'NO_PARTIES_CONFIGURED',
      'No parties are configured for this election, so figures cannot be entered.',
    );
  }

  // partyVotes must cover exactly the configured parties — name the offenders so
  // the transcriber knows what to fix.
  const configuredIds = new Set(parties.map((p) => p.id));
  const missing = parties.filter((p) => !(p.id in input.partyVotes));
  const unexpected = Object.keys(input.partyVotes).filter((id) => !configuredIds.has(id));
  if (missing.length > 0 || unexpected.length > 0) {
    const detail = [
      missing.length ? `missing votes for ${missing.map((p) => p.abbreviation).join(', ')}` : '',
      unexpected.length ? `unexpected party id(s): ${unexpected.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('; ');
    throw new AppError(
      'PARTY_VOTES_MISMATCH',
      `partyVotes must contain exactly one entry for each of this election's ${parties.length} ` +
        `parties (${parties.map((p) => p.abbreviation).join(', ')}) — ${detail}.`,
      'partyVotes',
    );
  }

  // Validation to ensure the figures correlate
  const partySum = Object.values(input.partyVotes).reduce((sum, v) => sum + v, 0);
  if (partySum !== input.totalValidVotes) {
    throw new AppError(
      'FIGURE_TALLY_MISMATCH',
      `Party votes add up to ${partySum}, but total valid votes is ${input.totalValidVotes}. ` +
        'The party votes must sum to the total valid votes.',
      'totalValidVotes',
    );
  }
  if (input.totalValidVotes + input.rejectedBallots !== input.totalVotesCast) {
    throw new AppError(
      'FIGURE_TALLY_MISMATCH',
      `Valid votes (${input.totalValidVotes}) + rejected ballots (${input.rejectedBallots}) = ` +
        `${input.totalValidVotes + input.rejectedBallots}, but total votes cast is ` +
        `${input.totalVotesCast}. They must be equal.`,
      'totalVotesCast',
    );
  }
  if (input.totalVotesCast > input.accreditedVoters) {
    throw new AppError(
      'FIGURE_TALLY_MISMATCH',
      `Total votes cast (${input.totalVotesCast}) cannot exceed accredited voters ` +
        `(${input.accreditedVoters}).`,
      'totalVotesCast',
    );
  }

  const figures: Figures = {
    accreditedVoters: input.accreditedVoters,
    totalValidVotes: input.totalValidVotes,
    rejectedBallots: input.rejectedBallots,
    totalVotesCast: input.totalVotesCast,
    partyVotes: input.partyVotes,
  };
  const figureHash = canonicalFigureHash(figures);

  let entry: { id: string; createdAt: Date };
  try {
    entry = await appDb.transaction(async (tx) => {
      const [created] = await tx
        .insert(transcriptionEntries)
        .values({
          sheetId: input.sheetId,
          transcriberId,
          accreditedVoters: figures.accreditedVoters,
          totalValidVotes: figures.totalValidVotes,
          rejectedBallots: figures.rejectedBallots,
          totalVotesCast: figures.totalVotesCast,
          partyVotes: figures.partyVotes,
          figureHash,
        })
        .returning({ id: transcriptionEntries.id, createdAt: transcriptionEntries.createdAt });

      await writeAudit(
        {
          actorId: transcriberId,
          actorRole: 'yiaga_transcriber',
          action: 'transcription.entry',
          entityType: 'sheet',
          entityId: input.sheetId,
          metadata: { entryId: created.id, figureHash },
          ipAddress: ip,
        },
        tx,
      );

      return created;
    });
  } catch (err) {
    if (isUniqueViolation(err, 'transcription_entries_sheet_transcriber_idx')) {
      throw new AppError('ALREADY_SUBMITTED', 'You have already transcribed this sheet.');
    }
    throw err;
  }

  // The reading is committed; release the soft claim and evaluate consensus.
  const redis = getRedis();
  await redis.del(activeClaimKey(transcriberId)).catch(() => undefined);

  const sheetStatus = await resolveSheet(input.sheetId);

  return {
    id: entry.id,
    sheetId: input.sheetId,
    figureHash,
    createdAt: entry.createdAt.toISOString(),
    sheetStatus,
  };
}

interface EntryRow {
  id: string;
  figureHash: string;
  accreditedVoters: number;
  totalValidVotes: number;
  rejectedBallots: number;
  totalVotesCast: number;
  partyVotes: unknown;
}

export async function resolveSheet(sheetId: string): Promise<'pending' | 'verified' | 'disputed'> {
  const redis = getRedis();
  const lockKey = consensusLockKey(sheetId);

  let locked = false;
  for (let attempt = 0; attempt < 6 && !locked; attempt += 1) {
    locked = (await redis.set(lockKey, '1', 'EX', LOCK_TTL_SECONDS, 'NX')) === 'OK';
    if (!locked) await sleep(150);
  }
  if (!locked) {
    // Another resolver holds the lock; it will see our committed entry. Report
    // the current status without racing it.
    return currentSheetStatus(sheetId);
  }

  try {
    const [sheet] = await appDb
      .select({
        status: sheets.status,
        electionId: sheets.electionId,
        stateId: sheets.stateId,
        lgaId: sheets.lgaId,
        puCode: sheets.puCode,
      })
      .from(sheets)
      .where(eq(sheets.id, sheetId))
      .limit(1);
    if (!sheet || sheet.status !== 'pending') {
      return sheet?.status ?? 'pending';
    }

    const entries: EntryRow[] = await appDb
      .select({
        id: transcriptionEntries.id,
        figureHash: transcriptionEntries.figureHash,
        accreditedVoters: transcriptionEntries.accreditedVoters,
        totalValidVotes: transcriptionEntries.totalValidVotes,
        rejectedBallots: transcriptionEntries.rejectedBallots,
        totalVotesCast: transcriptionEntries.totalVotesCast,
        partyVotes: transcriptionEntries.partyVotes,
      })
      .from(transcriptionEntries)
      .where(eq(transcriptionEntries.sheetId, sheetId))
      .orderBy(asc(transcriptionEntries.createdAt));

    const seen = new Map<string, EntryRow>();
    let agreement: { first: EntryRow; second: EntryRow } | null = null;
    for (const e of entries) {
      const prior = seen.get(e.figureHash);
      if (prior) {
        agreement = { first: prior, second: e };
        break;
      }
      seen.set(e.figureHash, e);
    }

    if (agreement) {
      await publishVerified(sheetId, sheet, agreement.first, agreement.second);
      return 'verified';
    }

    if (entries.length >= MAX_ENTRIES) {
      await markDisputed(sheetId);
      return 'disputed';
    }

    return 'pending';
  } finally {
    await redis.del(lockKey).catch(() => undefined);
  }
}

async function currentSheetStatus(sheetId: string): Promise<'pending' | 'verified' | 'disputed'> {
  const [sheet] = await appDb
    .select({ status: sheets.status })
    .from(sheets)
    .where(eq(sheets.id, sheetId))
    .limit(1);
  return sheet?.status ?? 'pending';
}


async function publishVerified(
  sheetId: string,
  sheet: { electionId: string; stateId: string; lgaId: string; puCode: string },
  first: EntryRow,
  second: EntryRow,
): Promise<void> {
  await appDb.transaction(async (tx) => {
    await tx.insert(electionResults).values({
      sheetId,
      electionId: sheet.electionId,
      stateId: sheet.stateId,
      lgaId: sheet.lgaId,
      puCode: sheet.puCode,
      accreditedVoters: second.accreditedVoters,
      totalValidVotes: second.totalValidVotes,
      rejectedBallots: second.rejectedBallots,
      totalVotesCast: second.totalVotesCast,
      partyVotes: second.partyVotes,
      agreedEntryIds: [first.id, second.id],
    });

    await tx
      .update(sheets)
      .set({ status: 'verified', updatedAt: new Date() })
      .where(eq(sheets.id, sheetId));

    await writeAudit(
      {
        actorId: null,
        actorRole: 'system',
        action: 'consensus.resolve',
        entityType: 'sheet',
        entityId: sheetId,
        metadata: { outcome: 'verified', agreedEntryIds: [first.id, second.id] },
      },
      tx,
    );
  });
}

/** Mark a sheet disputed after the tiebreaker fails to produce agreement. */
async function markDisputed(sheetId: string): Promise<void> {
  await appDb.transaction(async (tx) => {
    await tx
      .update(sheets)
      .set({ status: 'disputed', updatedAt: new Date() })
      .where(eq(sheets.id, sheetId));

    await writeAudit(
      {
        actorId: null,
        actorRole: 'system',
        action: 'consensus.resolve',
        entityType: 'sheet',
        entityId: sheetId,
        metadata: { outcome: 'disputed' },
      },
      tx,
    );
  });
}

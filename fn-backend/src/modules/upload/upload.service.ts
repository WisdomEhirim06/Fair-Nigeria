import { and, count, desc, eq, sql } from 'drizzle-orm';

import { appDb } from '../../db';
import {
  electionResults,
  elections,
  lgas,
  sheets,
  sheetFlags,
  type Sheet,
} from '../../db/app/schema';
import { isUniqueViolation } from '../../shared/db-errors';
import { AppError } from '../../shared/errors';
import { publicUrlFor, thumbnailUrlFor } from '../../shared/storage';
import type { Pagination } from '../../shared/response';
import { writeAudit, type AuditActor } from '../audit/audit.service';
import { listParties } from '../elections/elections.parties.service';
import type {
  FlagResult,
  ListSheetsQuery,
  PublicSheet,
  PublicSheetResult,
  SheetUploadFields,
} from './upload.schemas';

export type Actor = AuditActor;


export interface UploadedFile {
  r2Key: string;
  fileHash: string;
  fileSize: number;
  mimeType: string;
}

export function toPublicSheet(row: Sheet): PublicSheet {
  return {
    id: row.id,
    electionId: row.electionId,
    stateId: row.stateId,
    lgaId: row.lgaId,
    puCode: row.puCode,
    fileHash: row.fileHash,
    fileUrl: publicUrlFor(row.r2Key),
    thumbUrl: thumbnailUrlFor(row.r2Key, row.mimeType),
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    status: row.status,
    flagCount: row.flagCount,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createSheet(
  input: SheetUploadFields,
  file: UploadedFile,
  actor: Actor,
): Promise<PublicSheet> {
  const [election] = await appDb
    .select({ status: elections.status })
    .from(elections)
    .where(eq(elections.id, input.electionId))
    .limit(1);
  if (!election) {
    throw new AppError('NOT_FOUND', 'Election not found.', 'electionId');
  }
  if (election.status === 'upcoming') {
    throw new AppError(
      'UPLOAD_NOT_OPEN',
      'Sheets can only be uploaded once the election is active or concluded.',
      'electionId',
    );
  }

  const [lga] = await appDb
    .select({ stateId: lgas.stateId })
    .from(lgas)
    .where(eq(lgas.id, input.lgaId))
    .limit(1);
  if (!lga) {
    throw new AppError('NOT_FOUND', 'LGA not found.', 'lgaId');
  }
  if (lga.stateId !== input.stateId) {
    throw new AppError('VALIDATION_ERROR', 'The LGA does not belong to the given state.', 'lgaId');
  }

  const row = await appDb.transaction(async (tx) => {
    const [created] = await tx
      .insert(sheets)
      .values({
        electionId: input.electionId,
        stateId: input.stateId,
        lgaId: input.lgaId,
        puCode: input.puCode,
        uploadedBy: actor.id,
        r2Key: file.r2Key,
        fileHash: file.fileHash,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
      })
      .returning();

    await writeAudit(
      {
        actorId: actor.id,
        actorRole: actor.role,
        action: 'sheet.upload',
        entityType: 'sheet',
        entityId: created.id,
        metadata: {
          electionId: created.electionId,
          lgaId: created.lgaId,
          puCode: created.puCode,
          fileHash: created.fileHash,
        },
        ipAddress: actor.ip,
      },
      tx,
    );

    return created;
  });

  return toPublicSheet(row);
}

export async function listSheets(
  query: ListSheetsQuery,
): Promise<{ sheets: PublicSheet[]; pagination: Pagination }> {
  const filters = [
    query.electionId ? eq(sheets.electionId, query.electionId) : undefined,
    query.stateId ? eq(sheets.stateId, query.stateId) : undefined,
    query.lgaId ? eq(sheets.lgaId, query.lgaId) : undefined,
    query.status ? eq(sheets.status, query.status) : undefined,
  ].filter(Boolean);
  const where = filters.length ? and(...filters) : undefined;

  const [{ total }] = await appDb
    .select({ total: count() })
    .from(sheets)
    .where(where);

  const rows = await appDb
    .select()
    .from(sheets)
    .where(where)
    .orderBy(desc(sheets.createdAt))
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);

  return {
    sheets: rows.map(toPublicSheet),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      hasNext: query.page * query.limit < total,
    },
  };
}


export async function listMySheets(
  uploaderId: string,
  query: ListSheetsQuery,
): Promise<{ sheets: PublicSheet[]; pagination: Pagination }> {
  const filters = [
    eq(sheets.uploadedBy, uploaderId),
    query.electionId ? eq(sheets.electionId, query.electionId) : undefined,
    query.stateId ? eq(sheets.stateId, query.stateId) : undefined,
    query.lgaId ? eq(sheets.lgaId, query.lgaId) : undefined,
    query.status ? eq(sheets.status, query.status) : undefined,
  ].filter(Boolean);
  const where = and(...filters);

  const [{ total }] = await appDb.select({ total: count() }).from(sheets).where(where);

  const rows = await appDb
    .select()
    .from(sheets)
    .where(where)
    .orderBy(desc(sheets.createdAt))
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);

  return {
    sheets: rows.map(toPublicSheet),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      hasNext: query.page * query.limit < total,
    },
  };
}

export async function getSheet(id: string): Promise<PublicSheet> {
  const [row] = await appDb.select().from(sheets).where(eq(sheets.id, id)).limit(1);
  if (!row) {
    throw new AppError('NOT_FOUND', 'Sheet not found.');
  }
  return toPublicSheet(row);
}


// GET /sheets/:id/result — the agreed figures published from a verified sheet.

export async function getSheetResult(sheetId: string): Promise<PublicSheetResult> {
  const [sheet] = await appDb
    .select({ id: sheets.id, status: sheets.status })
    .from(sheets)
    .where(eq(sheets.id, sheetId))
    .limit(1);
  if (!sheet) {
    throw new AppError('NOT_FOUND', 'Sheet not found.');
  }

  const [row] = await appDb
    .select()
    .from(electionResults)
    .where(eq(electionResults.sheetId, sheetId))
    .limit(1);
  if (!row) {
    throw new AppError(
      'NOT_FOUND',
      sheet.status === 'disputed'
        ? 'This sheet is disputed, so no figures have been published from it.'
        : 'This sheet has not been verified yet, so no figures have been published from it.',
    );
  }

  // Resolve party ids to names so the reader never sees a bare UUID.
  const parties = await listParties(row.electionId);
  const votes = (row.partyVotes ?? {}) as Record<string, number>;
  const partyVotes = parties.map((p) => ({
    partyId: p.id,
    abbreviation: p.abbreviation,
    name: p.name,
    candidateName: p.candidateName,
    votes: votes[p.id] ?? 0,
  }));

  const agreed = Array.isArray(row.agreedEntryIds) ? row.agreedEntryIds.length : 0;

  return {
    sheetId,
    puCode: row.puCode,
    accreditedVoters: row.accreditedVoters,
    totalValidVotes: row.totalValidVotes,
    rejectedBallots: row.rejectedBallots,
    totalVotesCast: row.totalVotesCast,
    partyVotes,
    agreedReadings: agreed,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function flagSheet(
  sheetId: string,
  flaggedBy: string | null,
  ipAddress: string,
  reason: string | undefined,
  actorRole: string | null,
): Promise<FlagResult> {
  const [sheet] = await appDb
    .select({ id: sheets.id })
    .from(sheets)
    .where(eq(sheets.id, sheetId))
    .limit(1);
  if (!sheet) {
    throw new AppError('NOT_FOUND', 'Sheet not found.');
  }

  try {
    const flagCount = await appDb.transaction(async (tx) => {
      await tx.insert(sheetFlags).values({
        sheetId,
        flaggedBy,
        ipAddress,
        reason: reason ?? null,
      });

      const [updated] = await tx
        .update(sheets)
        .set({ flagCount: sql`${sheets.flagCount} + 1`, updatedAt: new Date() })
        .where(eq(sheets.id, sheetId))
        .returning({ flagCount: sheets.flagCount });

      await writeAudit(
        {
          actorId: flaggedBy,
          actorRole,
          action: 'sheet.flag',
          entityType: 'sheet',
          entityId: sheetId,
          metadata: { flagCount: updated.flagCount },
          ipAddress,
        },
        tx,
      );

      return updated.flagCount;
    });

    return { sheetId, flagCount };
  } catch (err) {
    if (isUniqueViolation(err, 'sheet_flags_sheet_ip_idx')) {
      throw new AppError('ALREADY_SUBMITTED', 'You have already flagged this sheet.');
    }
    throw err;
  }
}

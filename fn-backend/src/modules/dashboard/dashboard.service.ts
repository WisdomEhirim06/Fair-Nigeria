import { eq, sql } from 'drizzle-orm';

import { appDb } from '../../db';
import { electionResults, lgas, ratings, sheets, states } from '../../db/app/schema';
import { getRedis } from '../../shared/redis';
import { listParties } from '../elections/elections.parties.service';
import type {
  FigureTotals,
  LgaRatingSummary,
  LgaResultSummary,
  PartyTotal,
  RatingsDashboard,
  ResultsDashboard,
  SheetCounts,
  StateResultSummary,
  StateResultsDetail,
} from './dashboard.schemas';

/** Redis key holding the pre-aggregated ratings dashboard for one election. */
function ratingsKey(electionId: string): string {
  return `dashboard:ratings:${electionId}`;
}

function fraction(yes: number, total: number): number {
  return total > 0 ? Math.round((yes / total) * 100) / 100 : 0;
}

export async function getRatingsDashboard(electionId: string): Promise<RatingsDashboard> {
  const cached = await getRedis().get(ratingsKey(electionId));
  if (!cached) {
    return { electionId, totalRatings: 0, lastUpdated: null, byLga: [] };
  }
  return JSON.parse(cached) as RatingsDashboard;
}

/** Aggregate one election's ratings into the dashboard payload shape. */
async function aggregateElection(electionId: string): Promise<RatingsDashboard> {
  const rows = await appDb
    .select({
      lgaId: ratings.lgaId,
      lgaName: lgas.name,
      stateId: states.id,
      stateName: states.name,
      count: sql<number>`count(*)::int`,
      noIntimidation: sql<number>`count(*) filter (where ${ratings.noIntimidation})::int`,
      accreditationProper: sql<number>`count(*) filter (where ${ratings.accreditationProper})::int`,
      votingOrderly: sql<number>`count(*) filter (where ${ratings.votingOrderly})::int`,
      securityPresent: sql<number>`count(*) filter (where ${ratings.securityPresent})::int`,
      witnessedMalpractice: sql<number>`count(*) filter (where ${ratings.witnessedMalpractice})::int`,
    })
    .from(ratings)
    .innerJoin(lgas, eq(ratings.lgaId, lgas.id))
    .innerJoin(states, eq(lgas.stateId, states.id))
    .where(eq(ratings.electionId, electionId))
    .groupBy(ratings.lgaId, lgas.name, states.id, states.name);

  let totalRatings = 0;
  const byLga: LgaRatingSummary[] = rows.map((r) => {
    totalRatings += r.count;
    return {
      lgaId: r.lgaId,
      lgaName: r.lgaName,
      stateId: r.stateId,
      stateName: r.stateName,
      count: r.count,
      scores: {
        noIntimidation: fraction(r.noIntimidation, r.count),
        accreditationProper: fraction(r.accreditationProper, r.count),
        votingOrderly: fraction(r.votingOrderly, r.count),
        securityPresent: fraction(r.securityPresent, r.count),
        witnessedMalpractice: fraction(r.witnessedMalpractice, r.count),
      },
    };
  });

  // Most-rated LGAs first, then alphabetical for stable ordering.
  byLga.sort((a, b) => b.count - a.count || a.lgaName.localeCompare(b.lgaName));

  return { electionId, totalRatings, lastUpdated: new Date().toISOString(), byLga };
}

/**
 * Rebuild the Redis ratings-dashboard cache for every election that has ratings.
 * Invoked by the scheduled job every 15 minutes. Returns the number of elections
 * cached. Throws on Redis/DB failure so the caller can log it.
 */
export async function buildAndCacheRatingsDashboard(): Promise<{ elections: number }> {
  const distinct = await appDb
    .selectDistinct({ electionId: ratings.electionId })
    .from(ratings);

  const redis = getRedis();
  for (const { electionId } of distinct) {
    const payload = await aggregateElection(electionId);
    await redis.set(ratingsKey(electionId), JSON.stringify(payload));
  }

  return { elections: distinct.length };
}


function resultsKey(electionId: string): string {
  return `dashboard:results:${electionId}`;
}

function stateResultsKey(electionId: string, stateId: string): string {
  return `dashboard:results:${electionId}:state:${stateId}`;
}

const zeroFigures = (): FigureTotals => ({
  accreditedVoters: 0,
  totalValidVotes: 0,
  rejectedBallots: 0,
  totalVotesCast: 0,
});

const zeroCounts = (): SheetCounts => ({ verified: 0, disputed: 0, pending: 0 });

export async function getResultsDashboard(electionId: string): Promise<ResultsDashboard> {
  const cached = await getRedis().get(resultsKey(electionId));
  if (!cached) {
    return {
      electionId,
      lastUpdated: null,
      sheetCounts: zeroCounts(),
      national: { figures: zeroFigures(), partyTotals: [] },
      byState: [],
    };
  }
  return JSON.parse(cached) as ResultsDashboard;
}

export async function getStateResults(
  electionId: string,
  stateId: string,
): Promise<StateResultsDetail> {
  const cached = await getRedis().get(stateResultsKey(electionId, stateId));
  if (!cached) {
    return { electionId, stateId, stateName: '', lastUpdated: null, byLga: [] };
  }
  return JSON.parse(cached) as StateResultsDetail;
}

// Accumulator carrying everything summable at one geographic level.
interface Accumulator {
  figures: FigureTotals;
  partyVotes: Record<string, number>;
  counts: SheetCounts;
}

function newAccumulator(): Accumulator {
  return { figures: zeroFigures(), partyVotes: {}, counts: zeroCounts() };
}

function addInto(acc: Accumulator, figures: FigureTotals, partyVotes: Record<string, number>, counts: SheetCounts): void {
  acc.figures.accreditedVoters += figures.accreditedVoters;
  acc.figures.totalValidVotes += figures.totalValidVotes;
  acc.figures.rejectedBallots += figures.rejectedBallots;
  acc.figures.totalVotesCast += figures.totalVotesCast;
  for (const [partyId, votes] of Object.entries(partyVotes)) {
    acc.partyVotes[partyId] = (acc.partyVotes[partyId] ?? 0) + votes;
  }
  acc.counts.verified += counts.verified;
  acc.counts.disputed += counts.disputed;
  acc.counts.pending += counts.pending;
}

// Party totals sorted most-voted first, then by abbreviation for stability.
function toPartyTotals(
  parties: Awaited<ReturnType<typeof listParties>>,
  votes: Record<string, number>,
): PartyTotal[] {
  return parties
    .map((p) => ({
      partyId: p.id,
      abbreviation: p.abbreviation,
      name: p.name,
      votes: votes[p.id] ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes || a.abbreviation.localeCompare(b.abbreviation));
}

/** Rebuild and cache the results dashboard for one election. */
async function aggregateElectionResults(electionId: string): Promise<void> {
  const redis = getRedis();
  const parties = await listParties(electionId);

  // Verified figure + per-party sums per LGA. Party sums are built dynamically,
  // one bound-parameter jsonb lookup per configured party.
  const partySelect = Object.fromEntries(
    parties.map((p) => [
      p.id,
      sql<number>`coalesce(sum((${electionResults.partyVotes} ->> ${p.id})::int), 0)::int`,
    ]),
  );
  const figureRows = (await appDb
    .select({
      lgaId: electionResults.lgaId,
      accreditedVoters: sql<number>`coalesce(sum(${electionResults.accreditedVoters}), 0)::int`,
      totalValidVotes: sql<number>`coalesce(sum(${electionResults.totalValidVotes}), 0)::int`,
      rejectedBallots: sql<number>`coalesce(sum(${electionResults.rejectedBallots}), 0)::int`,
      totalVotesCast: sql<number>`coalesce(sum(${electionResults.totalVotesCast}), 0)::int`,
      ...partySelect,
    })
    .from(electionResults)
    .where(eq(electionResults.electionId, electionId))
    .groupBy(electionResults.lgaId)) as unknown as Array<Record<string, unknown>>;

  const figureByLga = new Map<string, { figures: FigureTotals; partyVotes: Record<string, number> }>();
  for (const row of figureRows) {
    const partyVotes: Record<string, number> = {};
    for (const p of parties) partyVotes[p.id] = Number(row[p.id] ?? 0);
    figureByLga.set(String(row.lgaId), {
      figures: {
        accreditedVoters: Number(row.accreditedVoters ?? 0),
        totalValidVotes: Number(row.totalValidVotes ?? 0),
        rejectedBallots: Number(row.rejectedBallots ?? 0),
        totalVotesCast: Number(row.totalVotesCast ?? 0),
      },
      partyVotes,
    });
  }

  // Every LGA that has any sheet, with its verified/disputed/pending counts and This is the master list of LGAs to report.
  const lgaRows = await appDb
    .select({
      lgaId: sheets.lgaId,
      lgaName: lgas.name,
      stateId: states.id,
      stateName: states.name,
      verified: sql<number>`count(*) filter (where ${sheets.status} = 'verified')::int`,
      disputed: sql<number>`count(*) filter (where ${sheets.status} = 'disputed')::int`,
      pending: sql<number>`count(*) filter (where ${sheets.status} = 'pending')::int`,
    })
    .from(sheets)
    .innerJoin(lgas, eq(sheets.lgaId, lgas.id))
    .innerJoin(states, eq(lgas.stateId, states.id))
    .where(eq(sheets.electionId, electionId))
    .groupBy(sheets.lgaId, lgas.name, states.id, states.name);

  const lastUpdated = new Date().toISOString();
  const national = newAccumulator();
  // stateId → { name, accumulator, lga summaries }
  const stateBuckets = new Map<
    string,
    { stateName: string; acc: Accumulator; lgas: LgaResultSummary[] }
  >();

  for (const row of lgaRows) {
    const fig = figureByLga.get(row.lgaId);
    const figures = fig?.figures ?? zeroFigures();
    const partyVotes = fig?.partyVotes ?? {};
    const counts: SheetCounts = {
      verified: row.verified,
      disputed: row.disputed,
      pending: row.pending,
    };

    const lgaSummary: LgaResultSummary = {
      lgaId: row.lgaId,
      lgaName: row.lgaName,
      sheetCounts: counts,
      figures,
      partyTotals: toPartyTotals(parties, partyVotes),
    };

    let bucket = stateBuckets.get(row.stateId);
    if (!bucket) {
      bucket = { stateName: row.stateName, acc: newAccumulator(), lgas: [] };
      stateBuckets.set(row.stateId, bucket);
    }
    bucket.lgas.push(lgaSummary);
    addInto(bucket.acc, figures, partyVotes, counts);
    addInto(national, figures, partyVotes, counts);
  }

  // Summary payload: national + per-state, no LGA detail.
  const byState: StateResultSummary[] = [...stateBuckets.entries()]
    .map(([stateId, b]) => ({
      stateId,
      stateName: b.stateName,
      sheetCounts: b.acc.counts,
      figures: b.acc.figures,
      partyTotals: toPartyTotals(parties, b.acc.partyVotes),
    }))
    .sort((a, b) => a.stateName.localeCompare(b.stateName));

  const summary: ResultsDashboard = {
    electionId,
    lastUpdated,
    sheetCounts: national.counts,
    national: { figures: national.figures, partyTotals: toPartyTotals(parties, national.partyVotes) },
    byState,
  };
  await redis.set(resultsKey(electionId), JSON.stringify(summary));

  // Per-state drill-down payloads.
  for (const [stateId, b] of stateBuckets.entries()) {
    const detail: StateResultsDetail = {
      electionId,
      stateId,
      stateName: b.stateName,
      lastUpdated,
      byLga: b.lgas.sort((a, c) => a.lgaName.localeCompare(c.lgaName)),
    };
    await redis.set(stateResultsKey(electionId, stateId), JSON.stringify(detail));
  }
}


export async function buildAndCacheResultsDashboard(): Promise<{ elections: number }> {
  const distinct = await appDb.selectDistinct({ electionId: sheets.electionId }).from(sheets);
  for (const { electionId } of distinct) {
    await aggregateElectionResults(electionId);
  }
  return { elections: distinct.length };
}

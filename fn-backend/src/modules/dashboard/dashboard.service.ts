import { eq, sql } from 'drizzle-orm';

import { appDb } from '../../db';
import { lgas, ratings, states } from '../../db/app/schema';
import { getRedis } from '../../shared/redis';
import type { LgaRatingSummary, RatingsDashboard } from './dashboard.schemas';

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

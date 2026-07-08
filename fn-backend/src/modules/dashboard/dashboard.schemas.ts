import { z } from 'zod';

import { uuidSchema } from '../../shared/validation';

export const ratingsDashboardQuerySchema = z.object({ electionId: uuidSchema }).strict();
export type RatingsDashboardQuery = z.infer<typeof ratingsDashboardQuerySchema>;

export const lgaRatingScoresSchema = z.object({
  noIntimidation: z.number(),
  accreditationProper: z.number(),
  votingOrderly: z.number(),
  securityPresent: z.number(),
  witnessedMalpractice: z.number(),
});

export const lgaRatingSummarySchema = z.object({
  lgaId: z.string().uuid(),
  lgaName: z.string(),
  stateId: z.string().uuid(),
  stateName: z.string(),
  count: z.number().int(),
  scores: lgaRatingScoresSchema,
});

export const ratingsDashboardSchema = z.object({
  electionId: z.string().uuid(),
  totalRatings: z.number().int(),
  // ISO timestamp of the last aggregation run; null until the first run lands.
  lastUpdated: z.string().datetime().nullable(),
  byLga: z.array(lgaRatingSummarySchema),
});

export type RatingsDashboard = z.infer<typeof ratingsDashboardSchema>;
export type LgaRatingSummary = z.infer<typeof lgaRatingSummarySchema>;


//  Results dashboard: verified EC8A figures rolled up LGA → state → national.

export const resultsDashboardQuerySchema = z.object({ electionId: uuidSchema }).strict();
export type ResultsDashboardQuery = z.infer<typeof resultsDashboardQuerySchema>;

export const stateResultsQuerySchema = z
  .object({ electionId: uuidSchema, stateId: uuidSchema })
  .strict();
export type StateResultsQuery = z.infer<typeof stateResultsQuerySchema>;

/** One party's summed votes at a given level (LGA, state, or national). */
export const partyTotalSchema = z.object({
  partyId: z.string().uuid(),
  abbreviation: z.string(),
  name: z.string(),
  votes: z.number().int(),
});
export type PartyTotal = z.infer<typeof partyTotalSchema>;

/** The four fixed EC8A aggregate figures, summed. */
export const figureTotalsSchema = z.object({
  accreditedVoters: z.number().int(),
  totalValidVotes: z.number().int(),
  rejectedBallots: z.number().int(),
  totalVotesCast: z.number().int(),
});
export type FigureTotals = z.infer<typeof figureTotalsSchema>;

/** Sheet outcomes contributing to (or excluded from) a level's figures. */
export const sheetCountsSchema = z.object({
  verified: z.number().int(),
  disputed: z.number().int(),
  pending: z.number().int(),
});
export type SheetCounts = z.infer<typeof sheetCountsSchema>;

export const stateResultSummarySchema = z.object({
  stateId: z.string().uuid(),
  stateName: z.string(),
  sheetCounts: sheetCountsSchema,
  figures: figureTotalsSchema,
  partyTotals: z.array(partyTotalSchema),
});
export type StateResultSummary = z.infer<typeof stateResultSummarySchema>;

/** National + per-state summary. The state → LGA drill-down is a separate key. */
export const resultsDashboardSchema = z.object({
  electionId: z.string().uuid(),
  lastUpdated: z.string().datetime().nullable(),
  sheetCounts: sheetCountsSchema,
  national: z.object({ figures: figureTotalsSchema, partyTotals: z.array(partyTotalSchema) }),
  byState: z.array(stateResultSummarySchema),
});
export type ResultsDashboard = z.infer<typeof resultsDashboardSchema>;

export const lgaResultSummarySchema = z.object({
  lgaId: z.string().uuid(),
  lgaName: z.string(),
  sheetCounts: sheetCountsSchema,
  figures: figureTotalsSchema,
  partyTotals: z.array(partyTotalSchema),
});
export type LgaResultSummary = z.infer<typeof lgaResultSummarySchema>;

/** One state's LGA-level breakdown, fetched on drill-down. */
export const stateResultsDetailSchema = z.object({
  electionId: z.string().uuid(),
  stateId: z.string().uuid(),
  stateName: z.string(),
  lastUpdated: z.string().datetime().nullable(),
  byLga: z.array(lgaResultSummarySchema),
});
export type StateResultsDetail = z.infer<typeof stateResultsDetailSchema>;

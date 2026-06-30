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

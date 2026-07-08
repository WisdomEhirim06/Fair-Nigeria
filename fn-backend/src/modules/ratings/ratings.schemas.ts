import { z } from 'zod';

import { uuidSchema } from '../../shared/validation';

export const RATING_CRITERIA = [
  { key: 'noIntimidation', question: 'Were you able to vote without intimidation?' },
  {
    key: 'accreditationProper',
    question: 'Was accreditation conducted properly at your polling unit?',
  },
  { key: 'votingOrderly', question: 'Did voting proceed in an orderly manner?' },
  { key: 'securityPresent', question: 'Was security personnel present at your polling unit?' },
  { key: 'witnessedMalpractice', question: 'Did you witness any form of electoral malpractice?' },
] as const;

export type RatingCriterionKey = (typeof RATING_CRITERIA)[number]['key'];

export const submitRatingBodySchema = z
  .object({
    electionId: uuidSchema,
    lgaId: uuidSchema,
    noIntimidation: z.boolean(),
    accreditationProper: z.boolean(),
    votingOrderly: z.boolean(),
    securityPresent: z.boolean(),
    witnessedMalpractice: z.boolean(),
  })
  .strict();

export type SubmitRatingInput = z.infer<typeof submitRatingBodySchema>;

export const myRatingQuerySchema = z.object({ electionId: uuidSchema }).strict();
export type MyRatingQuery = z.infer<typeof myRatingQuerySchema>;

export const ratingSchema = z.object({
  id: z.string().uuid(),
  electionId: z.string().uuid(),
  lgaId: z.string().uuid(),
  noIntimidation: z.boolean(),
  accreditationProper: z.boolean(),
  votingOrderly: z.boolean(),
  securityPresent: z.boolean(),
  witnessedMalpractice: z.boolean(),
  createdAt: z.string().datetime(),
});

export type PublicRating = z.infer<typeof ratingSchema>;

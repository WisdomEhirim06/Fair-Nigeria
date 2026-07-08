import { z } from 'zod';

import { uuidSchema } from '../../shared/validation';

/** The three election lifecycle states. Mirrors the election_status pg enum. */
export const ELECTION_STATUSES = ['upcoming', 'active', 'concluded'] as const;
export const electionStatusSchema = z.enum(ELECTION_STATUSES);
export type ElectionStatus = (typeof ELECTION_STATUSES)[number];

export const createElectionBodySchema = z
  .object({
    name: z.string().trim().min(3).max(160),
    // Presidential is the only in-scope type for 2027, but kept open as text.
    type: z.string().trim().min(3).max(60),
    // ISO-8601 scheduled polling date.
    electionDate: z.string().datetime(),
  })
  .strict();

export type CreateElectionInput = z.infer<typeof createElectionBodySchema>;

export const updateElectionStatusBodySchema = z
  .object({
    status: electionStatusSchema,
  })
  .strict();

export type UpdateElectionStatusInput = z.infer<typeof updateElectionStatusBodySchema>;

export const listElectionsQuerySchema = z
  .object({
    status: electionStatusSchema.optional(),
  })
  .strict();

export type ListElectionsQuery = z.infer<typeof listElectionsQuerySchema>;

/** Public-safe election shape returned by every endpoint. */
export const electionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  electionDate: z.string().datetime(),
  status: electionStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PublicElection = z.infer<typeof electionSchema>;

export const idParamSchema = z.object({ id: uuidSchema });
export type IdParam = z.infer<typeof idParamSchema>;

import { z } from 'zod';

import { uuidSchema } from '../../shared/validation';

export const createPartyBodySchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    abbreviation: z.string().trim().min(1).max(20),
    candidateName: z.string().trim().min(2).max(160).optional(),
  })
  .strict();

export type CreatePartyInput = z.infer<typeof createPartyBodySchema>;

export const updatePartyBodySchema = createPartyBodySchema.partial().strict();
export type UpdatePartyInput = z.infer<typeof updatePartyBodySchema>;

/** Route params for a party nested under its election. */
export const partyParamsSchema = z.object({
  id: uuidSchema, // election id
  partyId: uuidSchema,
});
export type PartyParams = z.infer<typeof partyParamsSchema>;

export const partySchema = z.object({
  id: z.string().uuid(),
  electionId: z.string().uuid(),
  name: z.string(),
  abbreviation: z.string(),
  candidateName: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type PublicParty = z.infer<typeof partySchema>;

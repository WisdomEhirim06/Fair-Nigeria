import { z } from 'zod';

import { uuidSchema } from '../../shared/validation';
import { partySchema } from '../elections/elections.parties.schemas';
import { sheetSchema } from '../upload/upload.schemas';

const voteCountSchema = z.number().int().min(0);

export const submitEntryBodySchema = z
  .object({
    sheetId: uuidSchema,
    accreditedVoters: voteCountSchema,
    totalValidVotes: voteCountSchema,
    rejectedBallots: voteCountSchema,
    totalVotesCast: voteCountSchema,
    partyVotes: z.record(uuidSchema, voteCountSchema),
  })
  .strict();

export type SubmitEntryInput = z.infer<typeof submitEntryBodySchema>;

/** The figure set that gets canonically hashed for consensus comparison. */
export interface Figures {
  accreditedVoters: number;
  totalValidVotes: number;
  rejectedBallots: number;
  totalVotesCast: number;
  partyVotes: Record<string, number>;
}

/** Confirmation returned to the transcriber after a submission. */
export const submitEntryResultSchema = z.object({
  id: z.string().uuid(),
  sheetId: z.string().uuid(),
  figureHash: z.string(),
  createdAt: z.string().datetime(),
  sheetStatus: z.enum(['pending', 'verified', 'disputed']),
});

export type SubmitEntryResult = z.infer<typeof submitEntryResultSchema>;

/** How many sheets are waiting for this transcriber. Powers the start screen. */
export const queueStatusSchema = z.object({
  waiting: z.number().int().min(0),
});

export type QueueStatus = z.infer<typeof queueStatusSchema>;

/** The next sheet handed to a transcriber, with the parties whose votes to enter. */
export const claimSchema = z.object({
  sheet: sheetSchema,
  parties: z.array(partySchema),
});

export type ClaimResult = z.infer<typeof claimSchema>;

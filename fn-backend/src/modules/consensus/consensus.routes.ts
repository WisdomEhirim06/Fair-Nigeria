import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/require-auth';
import { requireRole } from '../../shared/middleware/require-role';
import { validate } from '../../shared/middleware/validate';
import { claimSheetHandler, queueStatusHandler, submitEntryHandler } from './consensus.controller';
import { submitEntryBodySchema } from './consensus.schemas';

export const transcriptionRouter = Router();

// Count only — never reveals which sheets, so it can't be used to cherry-pick.
transcriptionRouter.get(
  '/queue',
  requireAuth,
  requireRole('yiaga_transcriber'),
  queueStatusHandler,
);

transcriptionRouter.post(
  '/claim',
  requireAuth,
  requireRole('yiaga_transcriber'),
  claimSheetHandler,
);


transcriptionRouter.post(
  '/entries',
  requireAuth,
  requireRole('yiaga_transcriber'),
  validate(submitEntryBodySchema),
  submitEntryHandler,
);

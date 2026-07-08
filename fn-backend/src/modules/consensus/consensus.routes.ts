import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/require-auth';
import { requireRole } from '../../shared/middleware/require-role';
import { validate } from '../../shared/middleware/validate';
import { claimSheetHandler, submitEntryHandler } from './consensus.controller';
import { submitEntryBodySchema } from './consensus.schemas';

export const transcriptionRouter = Router();

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

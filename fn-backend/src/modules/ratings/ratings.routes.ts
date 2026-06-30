import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/require-auth';
import { requireRole } from '../../shared/middleware/require-role';
import { validate } from '../../shared/middleware/validate';
import { getMyRatingHandler, submitRatingHandler } from './ratings.controller';
import { myRatingQuerySchema, submitRatingBodySchema } from './ratings.schemas';

export const ratingsRouter = Router();

// Citizens only — submit one rating per election, and read back their own.
ratingsRouter.post(
  '/',
  requireAuth,
  requireRole('citizen'),
  validate(submitRatingBodySchema),
  submitRatingHandler,
);
ratingsRouter.get(
  '/me',
  requireAuth,
  requireRole('citizen'),
  validate(myRatingQuerySchema, 'query'),
  getMyRatingHandler,
);

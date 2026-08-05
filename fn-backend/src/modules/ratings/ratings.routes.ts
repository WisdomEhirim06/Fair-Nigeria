import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/require-auth';
import { requireNin } from '../../shared/middleware/require-nin';
import { validate } from '../../shared/middleware/validate';
import { getMyRatingHandler, submitRatingHandler } from './ratings.controller';
import { myRatingQuerySchema, submitRatingBodySchema } from './ratings.schemas';

export const ratingsRouter = Router();

ratingsRouter.post(
  '/',
  requireAuth,
  requireNin,
  validate(submitRatingBodySchema),
  submitRatingHandler,
);
ratingsRouter.get(
  '/me',
  requireAuth,
  validate(myRatingQuerySchema, 'query'),
  getMyRatingHandler,
);

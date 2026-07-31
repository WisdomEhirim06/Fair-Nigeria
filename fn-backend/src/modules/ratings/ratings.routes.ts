import { Router } from 'express';

import { requireAuth } from '../../shared/middleware/require-auth';
import { validate } from '../../shared/middleware/validate';
import { getMyRatingHandler, submitRatingHandler } from './ratings.controller';
import { myRatingQuerySchema, submitRatingBodySchema } from './ratings.schemas';

export const ratingsRouter = Router();

// Any signed-in person may rate — staff are citizens too. Still one rating per
// person per election, and each reads back only their own.
ratingsRouter.post('/', requireAuth, validate(submitRatingBodySchema), submitRatingHandler);
ratingsRouter.get(
  '/me',
  requireAuth,
  validate(myRatingQuerySchema, 'query'),
  getMyRatingHandler,
);

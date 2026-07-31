import type { RequestHandler } from 'express';

import { successEnvelope } from '../../shared/response';
import { myRatingQuerySchema, type SubmitRatingInput } from './ratings.schemas';
import { getMyRating, submitRating } from './ratings.service';

/** POST /ratings — submit a rating for an election. Any signed-in role. */
export const submitRatingHandler: RequestHandler = async (req, res, next) => {
  try {
    const rating = await submitRating(req.user!.id, req.body as SubmitRatingInput);
    const requestId = req.id as unknown as string;
    res.status(201).json(successEnvelope(rating, requestId));
  } catch (err) {
    next(err);
  }
};

/** GET /ratings/me?electionId= — the citizen's own rating, or 404. */
export const getMyRatingHandler: RequestHandler = async (req, res, next) => {
  try {
    // Re-parse: Express 5's req.query is a getter, so validate's coercion may not persist.
    const { electionId } = myRatingQuerySchema.parse(req.query);
    const rating = await getMyRating(req.user!.id, electionId);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(rating, requestId));
  } catch (err) {
    next(err);
  }
};

import type { RequestHandler } from 'express';

import { successEnvelope } from '../../shared/response';
import { ratingsDashboardQuerySchema } from './dashboard.schemas';
import { getRatingsDashboard } from './dashboard.service';

export const getRatingsDashboardHandler: RequestHandler = async (req, res, next) => {
  try {
    const { electionId } = ratingsDashboardQuerySchema.parse(req.query);
    const dashboard = await getRatingsDashboard(electionId);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(dashboard, requestId));
  } catch (err) {
    next(err);
  }
};

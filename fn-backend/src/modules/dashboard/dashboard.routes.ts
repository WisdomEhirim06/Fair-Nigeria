import { Router } from 'express';

import { validate } from '../../shared/middleware/validate';
import { getRatingsDashboardHandler } from './dashboard.controller';
import { ratingsDashboardQuerySchema } from './dashboard.schemas';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/ratings',
  validate(ratingsDashboardQuerySchema, 'query'),
  getRatingsDashboardHandler,
);
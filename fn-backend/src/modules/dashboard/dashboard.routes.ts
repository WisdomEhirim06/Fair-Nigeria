import { Router } from 'express';

import { validate } from '../../shared/middleware/validate';
import {
  getRatingsDashboardHandler,
  getResultsDashboardHandler,
  getStateResultsHandler,
} from './dashboard.controller';
import {
  ratingsDashboardQuerySchema,
  resultsDashboardQuerySchema,
  stateResultsQuerySchema,
} from './dashboard.schemas';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/ratings',
  validate(ratingsDashboardQuerySchema, 'query'),
  getRatingsDashboardHandler,
);

dashboardRouter.get(
  '/results',
  validate(resultsDashboardQuerySchema, 'query'),
  getResultsDashboardHandler,
);

dashboardRouter.get(
  '/results/state',
  validate(stateResultsQuerySchema, 'query'),
  getStateResultsHandler,
);
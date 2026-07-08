import { z } from 'zod';

import { commonErrors, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import {
  ratingsDashboardSchema,
  resultsDashboardSchema,
  stateResultsDetailSchema,
} from './dashboard.schemas';

const RatingsDashboard = registry.register('RatingsDashboard', ratingsDashboardSchema);
const ResultsDashboard = registry.register('ResultsDashboard', resultsDashboardSchema);
const StateResultsDetail = registry.register('StateResultsDetail', stateResultsDetailSchema);

registry.registerPath({
  method: 'get',
  path: '/api/v1/dashboard/ratings',
  tags: ['Dashboard'],
  summary: 'Ratings dashboard',
  description:
    'Public, read-only aggregated citizen ratings for an election, broken down by LGA. ' +
    'Each score is the fraction (0–1) of raters in that LGA who answered yes. Served ' +
    'entirely from a Redis pre-aggregate rebuilt every 15 minutes; Postgres is never ' +
    'queried on this path. An election with no ratings yet returns an empty payload.',
  request: { query: z.object({ electionId: z.string().uuid() }) },
  responses: {
    200: jsonOk(RatingsDashboard, 'Aggregated ratings for the election.'),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/dashboard/results',
  tags: ['Dashboard'],
  summary: 'Results dashboard',
  description:
    'Public, read-only collated EC8A results for an election: national totals and ' +
    'a per-state summary, with per-party vote tallies. Only 2-of-3 verified sheets ' +
    'contribute figures; disputed and pending sheets are counted but excluded from ' +
    'the tallies. Served entirely from a Redis pre-aggregate rebuilt every 15 minutes; ' +
    'Postgres is never queried on this path.',
  request: { query: z.object({ electionId: z.string().uuid() }) },
  responses: {
    200: jsonOk(ResultsDashboard, 'National + per-state collated results.'),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/dashboard/results/state',
  tags: ['Dashboard'],
  summary: 'State results breakdown',
  description:
    "One state's LGA-level results breakdown for an election. Same aggregation rules " +
    'as the results dashboard. Served from Redis only.',
  request: { query: z.object({ electionId: z.string().uuid(), stateId: z.string().uuid() }) },
  responses: {
    200: jsonOk(StateResultsDetail, 'The state’s LGA breakdown.'),
    ...commonErrors(),
  },
});

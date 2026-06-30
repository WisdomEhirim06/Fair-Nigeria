import { z } from 'zod';

import { commonErrors, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import { ratingsDashboardSchema } from './dashboard.schemas';

const RatingsDashboard = registry.register('RatingsDashboard', ratingsDashboardSchema);

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

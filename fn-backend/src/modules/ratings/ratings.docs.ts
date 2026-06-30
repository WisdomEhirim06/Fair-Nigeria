import { z } from 'zod';

import { authErrors, commonErrors, jsonError, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import { ratingSchema, submitRatingBodySchema } from './ratings.schemas';

const SubmitRatingRequest = registry.register(
  'SubmitRatingRequest',
  submitRatingBodySchema.openapi({
    example: {
      electionId: '00000000-0000-0000-0000-000000000000',
      lgaId: '11111111-1111-1111-1111-111111111111',
      noIntimidation: true,
      accreditationProper: true,
      votingOrderly: true,
      securityPresent: true,
      witnessedMalpractice: false,
    },
  }),
);

const Rating = registry.register('Rating', ratingSchema);

registry.registerPath({
  method: 'post',
  path: '/api/v1/ratings',
  tags: ['Ratings'],
  summary: 'Submit a rating',
  description:
    'Records the authenticated citizen’s rating for an election.',
  security: [{ bearerAuth: [] }],
  request: {
    body: { required: true, content: { 'application/json': { schema: SubmitRatingRequest } } },
  },
  responses: {
    201: jsonOk(Rating, 'Rating recorded.'),
    404: jsonError('Election or LGA not found.'),
    409: jsonError('You have already rated this election.'),
    422: jsonError('Rating is not open for this election yet.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/ratings/me',
  tags: ['Ratings'],
  summary: 'Get my rating',
  description:
    'Returns the authenticated citizen’s own rating for the given election, or 404 if ' +
    'they have not rated it yet. Lets the UI choose between the form and the submitted ' +
    'state. Citizen role only.',
  security: [{ bearerAuth: [] }],
  request: { query: z.object({ electionId: z.string().uuid() }) },
  responses: {
    200: jsonOk(Rating, 'The citizen’s rating.'),
    404: jsonError('Not rated yet.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

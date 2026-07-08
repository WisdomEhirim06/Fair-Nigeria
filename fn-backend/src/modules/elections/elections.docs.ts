import { z } from 'zod';

import { authErrors, commonErrors, jsonError, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import {
  createElectionBodySchema,
  electionSchema,
  updateElectionStatusBodySchema,
} from './elections.schemas';

//  Schemas

const CreateElectionRequest = registry.register(
  'CreateElectionRequest',
  createElectionBodySchema.openapi({
    example: {
      name: '2027 Presidential Election',
      type: 'presidential',
      electionDate: '2027-02-27T07:00:00.000Z',
    },
  }),
);

const UpdateElectionStatusRequest = registry.register(
  'UpdateElectionStatusRequest',
  updateElectionStatusBodySchema.openapi({ example: { status: 'active' } }),
);

const Election = registry.register('Election', electionSchema);

//  Endpoints

registry.registerPath({
  method: 'get',
  path: '/api/v1/elections',
  tags: ['Elections'],
  summary: 'List elections',
  description: 'Lists elections newest-first, optionally filtered by status. Public.',
  request: {
    query: z.object({ status: z.enum(['upcoming', 'active', 'concluded']).optional() }),
  },
  responses: {
    200: jsonOk(z.array(Election), 'All elections.'),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/elections/{id}',
  tags: ['Elections'],
  summary: 'Get an election',
  description: 'Returns a single election by id. Public.',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: jsonOk(Election, 'The election.'),
    404: jsonError('Election not found.'),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/elections',
  tags: ['Elections'],
  summary: 'Create an election',
  description: 'Creates an election in the upcoming state. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: {
    body: { required: true, content: { 'application/json': { schema: CreateElectionRequest } } },
  },
  responses: {
    201: jsonOk(Election, 'Election created.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/elections/{id}/status',
  tags: ['Elections'],
  summary: 'Change election status',
  description:
    'Advances an election forward through upcoming → active → concluded. ' +
    'Transitions are forward-only and at most one election may be active at a time. ' +
    'Super admin only.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: UpdateElectionStatusRequest } },
    },
  },
  responses: {
    200: jsonOk(Election, 'Updated election.'),
    404: jsonError('Election not found.'),
    409: jsonError('Another election is already active.'),
    422: jsonError('Illegal status transition.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

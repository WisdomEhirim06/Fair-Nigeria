import { z } from 'zod';

import { authErrors, commonErrors, jsonError, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import {
  createPartyBodySchema,
  partySchema,
  updatePartyBodySchema,
} from './elections.parties.schemas';

const Party = registry.register('Party', partySchema);

const CreatePartyRequest = registry.register(
  'CreatePartyRequest',
  createPartyBodySchema.openapi({
    example: {
      name: 'All Progressives Congress',
      abbreviation: 'APC',
      candidateName: 'Candidate Name',
    },
  }),
);

const UpdatePartyRequest = registry.register(
  'UpdatePartyRequest',
  updatePartyBodySchema.openapi({ example: { candidateName: 'Updated Name' } }),
);

const electionIdParam = z.object({ id: z.string().uuid() });
const partyParams = z.object({ id: z.string().uuid(), partyId: z.string().uuid() });

registry.registerPath({
  method: 'get',
  path: '/api/v1/elections/{id}/parties',
  tags: ['Elections'],
  summary: 'List parties',
  description: "Lists an election's configured parties. Public.",
  request: { params: electionIdParam },
  responses: {
    200: jsonOk(z.array(Party), 'The election parties.'),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/elections/{id}/parties',
  tags: ['Elections'],
  summary: 'Add a party',
  description:
    'Adds a party to an election. Allowed only while the election is upcoming. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: {
    params: electionIdParam,
    body: { required: true, content: { 'application/json': { schema: CreatePartyRequest } } },
  },
  responses: {
    201: jsonOk(Party, 'Party added.'),
    404: jsonError('Election not found.'),
    409: jsonError('Duplicate abbreviation, or parties are locked.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/elections/{id}/parties/{partyId}',
  tags: ['Elections'],
  summary: 'Update a party',
  description: 'Edits a party while the election is still upcoming. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: {
    params: partyParams,
    body: { required: true, content: { 'application/json': { schema: UpdatePartyRequest } } },
  },
  responses: {
    200: jsonOk(Party, 'Party updated.'),
    404: jsonError('Election or party not found.'),
    409: jsonError('Duplicate abbreviation, or parties are locked.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/elections/{id}/parties/{partyId}',
  tags: ['Elections'],
  summary: 'Remove a party',
  description: 'Removes a party while the election is still upcoming. Super admin only.',
  security: [{ bearerAuth: [] }],
  request: { params: partyParams },
  responses: {
    204: { description: 'Party removed.' },
    404: jsonError('Election or party not found.'),
    409: jsonError('Parties are locked.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

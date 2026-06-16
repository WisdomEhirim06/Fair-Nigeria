import { z } from 'zod';

import { commonErrors, jsonError, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import { lgaSchema, stateSchema } from './geography.schemas';

const State = registry.register('State', stateSchema);
const Lga = registry.register('Lga', lgaSchema);

registry.registerPath({
  method: 'get',
  path: '/api/v1/geography/states',
  tags: ['Geography'],
  summary: 'List states',
  description: 'All 37 states (incl. FCT) with their geopolitical zone, alphabetical. Public.',
  responses: {
    200: jsonOk(z.array(State), 'All states.'),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/geography/states/{stateId}/lgas',
  tags: ['Geography'],
  summary: 'List LGAs in a state',
  description: 'Local Government Areas within the given state, alphabetical. Public.',
  request: { params: z.object({ stateId: z.string().uuid() }) },
  responses: {
    200: jsonOk(z.array(Lga), 'LGAs in the state.'),
    404: jsonError('State not found.'),
    ...commonErrors(),
  },
});

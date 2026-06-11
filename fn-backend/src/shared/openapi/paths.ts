/**
 * Kept separate from document.ts to avoid import cycles between the generator
 * and the modules that register paths.
 */
import { z } from 'zod';

import { jsonOk } from './helpers';
import { registry } from './registry';

// Module endpoint registrations (side-effect imports). Add one line per module
// as it gains documented routes.
import '../../modules/auth/auth.docs';
import '../../modules/admin/admin.docs';

registry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Liveness probe',
  description: 'Returns ok and process uptime. Used by load balancers and uptime checks.',
  responses: {
    200: jsonOk(
      z.object({
        status: z.literal('ok'),
        uptime: z.number().openapi({ example: 12.34, description: 'Process uptime in seconds.' }),
      }),
      'Service is healthy.',
    ),
  },
});

/**
 * Side-effect barrel: importing this file registers every module's endpoints
 * with the shared registry. Add a line here as each module gains documented
 * routes (co-located in a `*.docs.ts` beside the module's routes).
 *
 *   import '../../modules/auth/auth.docs';
 *
 * Kept separate from document.ts to avoid import cycles between the generator
 * and the modules that register paths.
 */
import { z } from 'zod';

import { jsonOk } from './helpers';
import { registry } from './registry';

// Health check — the working reference endpoint. Lives at the app root, not under
// /api/v1, so it is documented here rather than in a module.
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

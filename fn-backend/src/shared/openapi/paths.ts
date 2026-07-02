import { z } from 'zod';

import { jsonOk } from './helpers';
import { registry } from './registry';

import '../../modules/auth/auth.docs';
import '../../modules/admin/admin.docs';
import '../../modules/elections/elections.docs';
import '../../modules/content/content.docs';
import '../../modules/geography/geography.docs';
import '../../modules/ratings/ratings.docs';
import '../../modules/upload/upload.docs';
import '../../modules/dashboard/dashboard.docs';

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

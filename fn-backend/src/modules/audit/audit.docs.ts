import { z } from 'zod';

import { commonErrors, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import { auditEntrySchema } from './audit.schemas';

const AuditEntry = registry.register('AuditEntry', auditEntrySchema);

registry.registerPath({
  method: 'get',
  path: '/api/v1/audit',
  tags: ['Audit'],
  summary: 'Public audit trail',
  description:
    'Public, read-only, append-only record of governance and integrity actions — ' +
    'election and article changes, sheet uploads, transcription entries, and ' +
    'consensus resolutions. Newest first. Shows what happened and which role did ' +
    'it, never the actor’s identity or IP. Filter by action, entityType, or ' +
    'entityId (e.g. every event for one sheet).',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      action: z.string().optional(),
      entityType: z.string().optional(),
      entityId: z.string().optional(),
    }),
  },
  responses: {
    200: jsonOk(z.array(AuditEntry), 'Matching audit entries.'),
    ...commonErrors(),
  },
});

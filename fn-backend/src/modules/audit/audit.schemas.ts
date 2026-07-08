import { z } from 'zod';

import { paginationQuerySchema } from '../../shared/validation';

export const auditQuerySchema = paginationQuerySchema.extend({
  action: z.string().trim().max(80).optional(),
  entityType: z.string().trim().max(40).optional(),
  entityId: z.string().trim().max(64).optional(),
});

export type AuditQuery = z.infer<typeof auditQuerySchema>;


export const auditEntrySchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  actorRole: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string().datetime(),
});

export type PublicAuditEntry = z.infer<typeof auditEntrySchema>;

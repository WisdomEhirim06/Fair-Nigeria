import { appDb } from '../../db';
import { auditLog } from '../../db/app/schema';
import { logger } from '../../shared/logger';
import type { Role } from '../../shared/validation';

export interface AuditActor {
  id: string;
  role: Role;
  ip?: string | null;
}

// Append-only audit log. It can never be updated or deleted
export interface AuditEntry {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

type Tx = Parameters<Parameters<typeof appDb.transaction>[0]>[0];
type Executor = typeof appDb | Tx;


export async function writeAudit(entry: AuditEntry, executor: Executor = appDb): Promise<void> {
  await executor.insert(auditLog).values({
    actorId: entry.actorId ?? null,
    actorRole: entry.actorRole ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    metadata: entry.metadata ?? null,
    ipAddress: entry.ipAddress ?? null,
  });
}


export async function writeAuditSafe(entry: AuditEntry): Promise<void> {
  try {
    await writeAudit(entry);
  } catch (err) {
    logger.error({ err, action: entry.action, entityType: entry.entityType }, 'audit write failed');
  }
}

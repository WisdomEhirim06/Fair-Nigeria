import { and, count, desc, eq } from 'drizzle-orm';

import { appDb } from '../../db';
import { auditLog } from '../../db/app/schema';
import { logger } from '../../shared/logger';
import type { Pagination } from '../../shared/response';
import type { Role } from '../../shared/validation';
import type { AuditQuery, PublicAuditEntry } from './audit.schemas';

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



export async function listAuditLog(
  query: AuditQuery,
): Promise<{ entries: PublicAuditEntry[]; pagination: Pagination }> {
  const filters = [
    query.action ? eq(auditLog.action, query.action) : undefined,
    query.entityType ? eq(auditLog.entityType, query.entityType) : undefined,
    query.entityId ? eq(auditLog.entityId, query.entityId) : undefined,
  ].filter(Boolean);
  const where = filters.length ? and(...filters) : undefined;

  const [{ total }] = await appDb.select({ total: count() }).from(auditLog).where(where);

  const rows = await appDb
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      actorRole: auditLog.actorRole,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);

  const entries: PublicAuditEntry[] = rows.map((r) => ({
    id: r.id,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    actorRole: r.actorRole,
    metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return {
    entries,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      hasNext: query.page * query.limit < total,
    },
  };
}

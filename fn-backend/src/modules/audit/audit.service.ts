import { and, count, desc, eq, inArray } from 'drizzle-orm';

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


const PUBLIC_AUDIT_ACTIONS = [
  'election.create',
  'election.status_change',
  'election.party_add',
  'election.party_update',
  'election.party_remove',
  'sheet.upload',
  'sheet.flag',
  'consensus.resolve',
] as const;

const PUBLIC_METADATA_KEYS = new Set([
  'puCode',
  'fileHash',
  'name',
  'type',
  'status',
  'from',
  'to',
  'abbreviation',
  'outcome',
  'flagCount',
]);

function publicMetadata(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (PUBLIC_METADATA_KEYS.has(key)) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export async function listAuditLog(
  query: AuditQuery,
): Promise<{ entries: PublicAuditEntry[]; pagination: Pagination }> {
  const actionFilter =
    query.action && (PUBLIC_AUDIT_ACTIONS as readonly string[]).includes(query.action)
      ? eq(auditLog.action, query.action)
      : query.action
        ? eq(auditLog.action, '__none__')
        : inArray(auditLog.action, [...PUBLIC_AUDIT_ACTIONS]);

  const filters = [
    actionFilter,
    query.entityType ? eq(auditLog.entityType, query.entityType) : undefined,
    query.entityId ? eq(auditLog.entityId, query.entityId) : undefined,
  ].filter(Boolean);
  const where = and(...filters);

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
    metadata: publicMetadata(r.metadata),
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

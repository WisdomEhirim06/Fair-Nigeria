// Public audit trail. Read-only, paginated, filterable.

import { request } from './client';
import type { AuditEntry } from './types';

export interface AuditFilters {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
}

export async function listAudit(filters: AuditFilters = {}): Promise<AuditEntry[]> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.action) params.set('action', filters.action);
  if (filters.entityType) params.set('entityType', filters.entityType);
  if (filters.entityId) params.set('entityId', filters.entityId);
  const qs = params.toString();
  return request<AuditEntry[]>(`/audit${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

// Super-admin endpoints: invite codes and user management.

import { request } from './client';
import type {
  ApiUser,
  CreatedInviteCode,
  GeopoliticalZone,
  InviteCode,
  ProvisionableRole,
  Role,
} from './types';

//  Invite codes

export async function listInviteCodes(): Promise<InviteCode[]> {
  return request<InviteCode[]>('/invite-codes', { method: 'GET' });
}

export interface CreateInviteCodeInput {
  role: ProvisionableRole;
  maxUses: number;
  expiresAt: string;
  state?: string;
  geopoliticalZone?: GeopoliticalZone;
  code?: string;
}

/** Mint a code. The plaintext in the response is shown once and never retrievable again. */
export async function createInviteCode(input: CreateInviteCodeInput): Promise<CreatedInviteCode> {
  return request<CreatedInviteCode>('/invite-codes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function revokeInviteCode(id: string): Promise<InviteCode> {
  return request<InviteCode>(`/invite-codes/${id}`, { method: 'DELETE' });
}

//  Users

export interface ListUsersFilters {
  page?: number;
  limit?: number;
  role?: Role;
  state?: string;
  isActive?: boolean;
}

export async function listUsers(filters: ListUsersFilters = {}): Promise<ApiUser[]> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.role) params.set('role', filters.role);
  if (filters.state) params.set('state', filters.state);
  if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
  const qs = params.toString();
  return request<ApiUser[]>(`/users${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

export interface UpdateUserInput {
  role?: Role;
  isActive?: boolean;
  state?: string;
  geopoliticalZone?: GeopoliticalZone;
}

export async function updateUser(id: string, patch: UpdateUserInput): Promise<ApiUser> {
  return request<ApiUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

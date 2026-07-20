// Election endpoints.

import { request } from './client';
import type { Election, ElectionStatus } from './types';

export async function listElections(status?: ElectionStatus): Promise<Election[]> {
  const query = status ? `?status=${status}` : '';
  return request<Election[]>(`/elections${query}`, { method: 'GET' });
}

export async function getElection(id: string): Promise<Election> {
  return request<Election>(`/elections/${id}`, { method: 'GET' });
}

export interface CreateElectionInput {
  name: string;
  type: string;
  electionDate: string; // ISO-8601
}

/** Create an election. Super admin only. */
export async function createElection(input: CreateElectionInput): Promise<Election> {
  return request<Election>('/elections', { method: 'POST', body: JSON.stringify(input) });
}

/** Advance an election's lifecycle status. Super admin only. */
export async function changeElectionStatus(
  id: string,
  status: ElectionStatus,
): Promise<Election> {
  return request<Election>(`/elections/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}


export async function getCurrentElection(): Promise<Election | null> {
  const all = await listElections();
  const byDateDesc = [...all].sort((a, b) => b.electionDate.localeCompare(a.electionDate));
  return (
    byDateDesc.find((e) => e.status === 'active') ??
    byDateDesc.find((e) => e.status === 'concluded') ??
    byDateDesc.find((e) => e.status === 'upcoming') ??
    null
  );
}

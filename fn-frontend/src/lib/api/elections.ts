// Election endpoints.

import { request } from './client';
import type { Election, ElectionStatus } from './types';

export async function listElections(status?: ElectionStatus): Promise<Election[]> {
  const query = status ? `?status=${status}` : '';
  return request<Election[]>(`/elections${query}`, { method: 'GET' });
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

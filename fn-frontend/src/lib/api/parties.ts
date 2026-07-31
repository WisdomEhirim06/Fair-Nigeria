// Election parties — public list + super-admin CRUD (editable only while upcoming).

import { request } from './client';
import type { Party } from './types';

export async function listParties(electionId: string): Promise<Party[]> {
  return request<Party[]>(`/elections/${electionId}/parties`, { method: 'GET' });
}

export interface PartyInput {
  name: string;
  abbreviation: string;
  candidateName?: string;
}

export async function createParty(electionId: string, input: PartyInput): Promise<Party> {
  return request<Party>(`/elections/${electionId}/parties`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateParty(
  electionId: string,
  partyId: string,
  input: Partial<PartyInput>,
): Promise<Party> {
  return request<Party>(`/elections/${electionId}/parties/${partyId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteParty(electionId: string, partyId: string): Promise<void> {
  await request<void>(`/elections/${electionId}/parties/${partyId}`, { method: 'DELETE' });
}

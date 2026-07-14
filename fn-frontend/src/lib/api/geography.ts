// Geography endpoints, the reference data for the forms.

import { request } from './client';
import type { Lga, StateOption } from './types';


export async function listStates(): Promise<StateOption[]> {
  return request<StateOption[]>('/geography/states', { method: 'GET' });
}

/** The LGAs within a state, for the rating location cascade. */
export async function listLgas(stateId: string): Promise<Lga[]> {
  return request<Lga[]>(`/geography/states/${stateId}/lgas`, { method: 'GET' });
}

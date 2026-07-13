// Geography endpoints, the reference data for the forms.

import { request } from './client';
import type { StateOption } from './types';


export async function listStates(): Promise<StateOption[]> {
  return request<StateOption[]>('/geography/states', { method: 'GET' });
}

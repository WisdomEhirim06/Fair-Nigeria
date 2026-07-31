// Public dashboard endpoints.

import { request } from './client';
import type { RatingsDashboard, ResultsDashboard } from './types';

// Collated results
export async function getResultsDashboard(electionId: string): Promise<ResultsDashboard> {
  return request<ResultsDashboard>(`/dashboard/results?electionId=${electionId}`, { method: 'GET' });
}

// Ratings aggregated per LGA
export async function getRatingsDashboard(electionId: string): Promise<RatingsDashboard> {
  return request<RatingsDashboard>(`/dashboard/ratings?electionId=${electionId}`, { method: 'GET' });
}

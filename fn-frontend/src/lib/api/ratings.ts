// Ratings endpoints. Immutable once sent.

import { ApiError, request } from './client';
import type { Rating, RatingInput } from './types';

export async function submitRating(input: RatingInput): Promise<Rating> {
  return request<Rating>('/ratings', { method: 'POST', body: JSON.stringify(input) });
}

/** The caller's rating for an election, or null if they haven't rated it yet. */
export async function getMyRating(electionId: string): Promise<Rating | null> {
  try {
    return await request<Rating>(`/ratings/me?electionId=${electionId}`, { method: 'GET' });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

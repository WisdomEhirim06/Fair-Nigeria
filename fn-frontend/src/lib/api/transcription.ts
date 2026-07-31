// Transcription — the pull-and-read side for Yiaga transcribers.

import { ApiError, request } from './client';
import type { Claim, QueueStatus, TranscriptionInput, TranscriptionResult } from './types';

/**
 * How many sheets are waiting for this transcriber. A count only — the server
 * never lists which sheets, so no one can pick a specific one to transcribe.
 */
export async function getQueueStatus(): Promise<QueueStatus> {
  return request<QueueStatus>('/transcription/queue', { method: 'GET' });
}

/**
 * Claim the next sheet awaiting readings. Returns null when the queue is empty
 * (the backend answers 404 NO_SHEETS_AVAILABLE). A live claim auto-resumes on
 * the server, so calling this after a reload hands back the same sheet.
 */
export async function claimNextSheet(): Promise<Claim | null> {
  try {
    return await request<Claim>('/transcription/claim', { method: 'POST' });
  } catch (err) {
    if (err instanceof ApiError && err.code === 'NO_SHEETS_AVAILABLE') return null;
    throw err;
  }
}

/** Submit one reading of a sheet's figures. */
export async function submitEntry(input: TranscriptionInput): Promise<TranscriptionResult> {
  return request<TranscriptionResult>('/transcription/entries', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// EC8A result sheets — the field officer's write side plus their own-uploads list.

import { request } from './client';
import type { Sheet, SheetStatus } from './types';

export interface UploadSheetInput {
  electionId: string;
  stateId: string;
  lgaId: string;
  puCode: string;
  file: File;
}

/**
 * Upload one EC8A sheet. Sends multipart/form-data; the fields must precede the
 * file part (the backend validates fields before it starts streaming the file).
 */
export async function uploadSheet(input: UploadSheetInput): Promise<Sheet> {
  const form = new FormData();
  form.set('electionId', input.electionId);
  form.set('stateId', input.stateId);
  form.set('lgaId', input.lgaId);
  form.set('puCode', input.puCode);
  form.set('file', input.file);
  return request<Sheet>('/upload', { method: 'POST', body: form });
}

export interface MyUploadsFilters {
  page?: number;
  limit?: number;
  electionId?: string;
  status?: SheetStatus;
}

/** Raise a flag against a sheet (e.g. a transcriber marking one illegible). */
export async function flagSheet(sheetId: string, reason?: string): Promise<{ sheetId: string; flagCount: number }> {
  return request<{ sheetId: string; flagCount: number }>(`/sheets/${sheetId}/flag`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

/** The signed-in officer's own uploads (auth-scoped; the public list hides uploaders). */
export async function listMyUploads(filters: MyUploadsFilters = {}): Promise<Sheet[]> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.electionId) params.set('electionId', filters.electionId);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  return request<Sheet[]>(`/upload/mine${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

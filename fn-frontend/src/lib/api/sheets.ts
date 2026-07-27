// EC8A result sheets — the field officer's write side plus their own-uploads list.

import { ApiError, request } from './client';
import type { Sheet, SheetResult, SheetStatus } from './types';

export interface UploadSheetInput {
  electionId: string;
  stateId: string;
  lgaId: string;
  puCode: string;
  file: File;
}

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

//  Public read side

export interface SheetFilters {
  page?: number;
  limit?: number;
  electionId?: string;
  stateId?: string;
  lgaId?: string;
  status?: SheetStatus;
}

/** Browse uploaded sheets. Public — anyone can inspect the paper trail. */
export async function listSheets(filters: SheetFilters = {}): Promise<Sheet[]> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.electionId) params.set('electionId', filters.electionId);
  if (filters.stateId) params.set('stateId', filters.stateId);
  if (filters.lgaId) params.set('lgaId', filters.lgaId);
  if (filters.status) params.set('status', filters.status);
  const qs = params.toString();
  return request<Sheet[]>(`/sheets${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

/** A single sheet by id. Public. */
export async function getSheet(id: string): Promise<Sheet> {
  return request<Sheet>(`/sheets/${id}`, { method: 'GET' });
}

/**
 * The figures published from a sheet. Returns null when nothing has been
 * published from it yet — pending and disputed sheets legitimately have none.
 */
export async function getSheetResult(id: string): Promise<SheetResult | null> {
  try {
    return await request<SheetResult>(`/sheets/${id}/result`, { method: 'GET' });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
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

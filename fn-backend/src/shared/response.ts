/**
 * Standard JSON response envelope used by every endpoint. Clients always check
 * `success` before reading `data` or `error`.
 */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  pagination?: Pagination;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ErrorEnvelope {
  success: false;
  error: ApiError;
  meta: ResponseMeta;
}

function buildMeta(requestId?: string, pagination?: Pagination): ResponseMeta {
  return {
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
    ...(pagination ? { pagination } : {}),
  };
}

export function successEnvelope<T>(
  data: T,
  requestId?: string,
  pagination?: Pagination,
): SuccessEnvelope<T> {
  return { success: true, data, meta: buildMeta(requestId, pagination) };
}

export function errorEnvelope(error: ApiError, requestId?: string): ErrorEnvelope {
  return { success: false, error, meta: buildMeta(requestId) };
}

// Canonical http reponse and error codes for the various api references

export const ERROR_CODES = {
  VALIDATION_ERROR: { http: 400, code: 'VALIDATION_ERROR' },
  UNAUTHORIZED: { http: 401, code: 'UNAUTHORIZED' },
  FORBIDDEN: { http: 403, code: 'FORBIDDEN' },
  NOT_FOUND: { http: 404, code: 'NOT_FOUND' },
  DUPLICATE_NIN: { http: 409, code: 'DUPLICATE_NIN' },
  DUPLICATE_PHONE: { http: 409, code: 'DUPLICATE_PHONE' },
  ALREADY_RATED: { http: 409, code: 'ALREADY_RATED' },
  ALREADY_SUBMITTED: { http: 409, code: 'ALREADY_SUBMITTED' },
  FILE_TOO_LARGE: { http: 413, code: 'FILE_TOO_LARGE' },
  INVALID_FILE_TYPE: { http: 415, code: 'INVALID_FILE_TYPE' },
  RESOLUTION_TOO_LOW: { http: 422, code: 'RESOLUTION_TOO_LOW' },
  RATE_LIMITED: { http: 429, code: 'RATE_LIMITED' },
  INTERNAL_ERROR: { http: 500, code: 'INTERNAL_ERROR' },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly field?: string;

  constructor(code: ErrorCode, message?: string, field?: string) {
    const def = ERROR_CODES[code];
    super(message ?? def.code);
    this.name = 'AppError';
    this.statusCode = def.http;
    this.code = def.code;
    this.field = field;
  }
}

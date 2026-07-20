import { getAccessToken, setAccessToken } from './session';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

// A failed API call. `field` maps a validation error back to a specific input.
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly field?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; field?: string };
}



let inFlightRefresh: Promise<boolean> | null = null;

export function attemptRefresh(): Promise<boolean> {
  if (!inFlightRefresh) {
    inFlightRefresh = runRefresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

async function runRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    const body = (await res.json().catch(() => null)) as Envelope<{ accessToken: string }> | null;
    if (res.ok && body?.success && body.data) {
      setAccessToken(body.data.accessToken);
      return true;
    }
  } catch {
    // network error — fall through to failure
  }
  setAccessToken(null);
  return false;
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
  allowRetry = true,
): Promise<T> {
  const token = getAccessToken();
  // Let the browser set the multipart boundary for FormData; only default to
  // JSON for regular bodies.
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Access token expired.
  if (res.status === 401 && allowRetry && !path.startsWith('/auth/refresh')) {
    if (await attemptRefresh()) return request<T>(path, options, false);
  }

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body?.success) {
    throw new ApiError(
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? 'Something went wrong. Please try again.',
      res.status,
      body?.error?.field,
    );
  }
  return body.data as T;
}

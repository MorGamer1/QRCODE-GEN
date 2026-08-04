const API_BASE = '/api/v1';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  /** Internal: set on the retry attempt after a silent refresh so we never loop. */
  skipAuthRetry?: boolean;
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) qs.set(key, String(value));
    }
    const qsString = qs.toString();
    if (qsString) url += `?${qsString}`;
  }
  return url;
}

// The access token cookie is short-lived (15 min). Rather than surface a 401 to every
// caller once it lapses, we transparently swap in the refresh token and retry - the user
// only ever notices a hard logout once the refresh token itself is gone. Concurrent 401s
// share a single in-flight refresh instead of racing separate /auth/refresh calls.
let refreshPromise: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(buildUrl('/auth/refresh'), { method: 'POST', credentials: 'include' })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const AUTH_RETRY_EXEMPT_PATHS = new Set(['/auth/refresh', '/auth/login', '/auth/register']);

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, headers, skipAuthRetry, ...init } = options;
  const isFormData = body instanceof FormData;

  const res = await fetch(buildUrl(path, params), {
    ...init,
    credentials: 'include',
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    headers: {
      ...(isFormData ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  });

  if (res.status === 401 && !skipAuthRetry && !AUTH_RETRY_EXEMPT_PATHS.has(path)) {
    const refreshed = await refreshSession();
    if (refreshed) return request<T>(path, { ...options, skipAuthRetry: true });
  }

  if (!res.ok) {
    let message = res.statusText;
    let details: unknown;
    try {
      const errBody = await res.json();
      message = Array.isArray(errBody.message) ? errBody.message.join(', ') : (errBody.message ?? message);
      details = errBody;
    } catch {
      // response wasn't JSON - keep the statusText message
    }
    throw new ApiError(res.status, message, details);
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return res.json() as Promise<T>;
  return res.text() as unknown as T;
}

export const api = {
  get: <T,>(path: string, params?: RequestOptions['params']) => request<T>(path, { method: 'GET', params }),
  post: <T,>(path: string, body?: unknown, params?: RequestOptions['params']) =>
    request<T>(path, { method: 'POST', body, params }),
  put: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'DELETE', body }),
};

/** Builds a same-origin URL for downloads/exports meant to be opened directly (not fetched via JS). */
export function apiDownloadUrl(path: string, params?: RequestOptions['params']): string {
  return buildUrl(path, params);
}

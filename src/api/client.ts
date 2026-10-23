/**
 * Small fetch wrapper for the FastAPI backend.
 *
 * - Adds the Supabase access token to every request.
 * - Turns every failure into an ApiError with a message you can show to the user.
 * - Retries GET requests a couple of times, because Render's free server needs
 *   up to a minute to wake up after being idle.
 * - On a 401 it asks for a fresh token once and retries.
 */
import Constants from 'expo-constants';

/**
 * Resolves the FastAPI backend base URL.
 * In development / Expo Go, dynamically extracts the host IP from the active Metro connection
 * so the phone can always reach the backend even if the Wi-Fi IP changes.
 */
function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  // If pointed to a remote production URL (not local LAN or localhost), use it directly
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1') && !envUrl.includes('192.168.')) {
    return envUrl.replace(/\/$/, '');
  }

  // In development, dynamically extract the host IP from the active Expo connection
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:8000`;
    }
  }

  return (envUrl || 'http://192.168.29.113:8000').replace(/\/$/, '');
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  /** HTTP status, or 0 for network errors and timeouts */
  status: number;
  /** Raw detail from the server (string or validation error list) */
  detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }

  get isNetwork() {
    return this.status === 0;
  }
  get isUnauthorized() {
    return this.status === 401;
  }
  /** 403 from GET /users/me means "logged in, but no profile yet" */
  get isForbidden() {
    return this.status === 403;
  }
  get isConflict() {
    return this.status === 409;
  }
}

type AuthHandlers = {
  /** Return the current access token, or null when signed out */
  getToken: () => Promise<string | null>;
  /** Optional: force a token refresh. Return the new token or null. */
  refreshToken?: () => Promise<string | null>;
  /** Optional: called when a 401 persists, so the app can send the user to login */
  onSignedOut?: () => void;
};

let handlers: AuthHandlers = { getToken: async () => null };

export function configureApiAuth(next: AuthHandlers) {
  handlers = next;
}

export type Query = Record<string, string | number | boolean | Date | null | undefined>;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  /** Default 45 s: long enough for a cold start on the free Render tier */
  timeoutMs?: number;
  /** Extra tries for GET on network errors and 502/503/504. Default 2. */
  retries?: number;
}

function buildUrl(path: string, query?: Query): string {
  if (!API_URL) {
    throw new ApiError(0, 'EXPO_PUBLIC_API_URL is not set');
  }
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, value instanceof Date ? value.toISOString() : String(value));
    }
  }
  return url.toString();
}

/** FastAPI sends {detail: "text"} or {detail: [{loc, msg}, ...]} for validation errors. */
function messageFromDetail(status: number, detail: unknown): string {
  // Never show raw server errors (HTML pages, "Internal Server Error") to the user.
  if (status >= 500 && (typeof detail !== 'string' || detail === 'Internal Server Error')) {
    return 'Something went wrong on our side. Please try again.';
  }
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { loc?: unknown[]; msg?: string };
    const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : '';
    return field ? `${field}: ${first.msg ?? 'invalid'}` : (first.msg ?? 'Invalid request');
  }
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return 'Request failed';
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function once(path: string, opts: RequestOptions, token: string | null): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 45000);
  // Let the caller cancel too (for example when a screen unmounts).
  opts.signal?.addEventListener('abort', () => controller.abort());
  try {
    return await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (opts.signal?.aborted) throw new ApiError(0, 'Request cancelled');
    if (controller.signal.aborted) throw new ApiError(0, 'The server took too long to respond. Please try again.');
    throw new ApiError(0, 'No connection. Check your internet and try again.', err);
  } finally {
    clearTimeout(timer);
  }
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const maxRetries = method === 'GET' ? (opts.retries ?? 2) : 0;

  let token = await handlers.getToken();
  let refreshed = false;

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await once(path, opts, token);
    } catch (err) {
      if (err instanceof ApiError && err.status === 0 && attempt < maxRetries && err.message !== 'Request cancelled') {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      throw err;
    }

    if (res.status === 401 && !refreshed && handlers.refreshToken) {
      refreshed = true;
      token = await handlers.refreshToken();
      if (token) continue;
    }

    if ([502, 503, 504].includes(res.status) && attempt < maxRetries) {
      await sleep(1500 * (attempt + 1));
      continue;
    }

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    let data: unknown = undefined;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      // Only trust the {detail} field of a JSON error body; anything else (HTML, plain text) stays out of the message.
      const detail = typeof data === 'object' && data !== null ? (data as { detail?: unknown }).detail : undefined;
      if (res.status === 401) handlers.onSignedOut?.();
      throw new ApiError(res.status, messageFromDetail(res.status, detail), detail);
    }
    return data as T;
  }
}

/** Message to show the user for any error thrown by the API layer. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

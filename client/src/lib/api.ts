import type { ApiEnvelope } from "../types";

const API_BASE = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  refreshPromise ??= fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include"
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function requestRaw<T>(
  path: string,
  init: RequestInit = {},
  options: { retry?: boolean; skipRefresh?: boolean } = {}
): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include"
  });

  if (
    response.status === 401 &&
    options.retry !== false &&
    !options.skipRefresh &&
    !path.startsWith("/auth/login") &&
    !path.startsWith("/auth/register") &&
    !path.startsWith("/auth/refresh")
  ) {
    if (await tryRefresh()) {
      return requestRaw<T>(path, init, { retry: false, skipRefresh: true });
    }
  }

  if (response.status === 204) {
    return { success: true, data: undefined as T };
  }

  const body = (await response.json().catch(() => null)) as (ApiEnvelope<T> & {
    message?: string;
    errors?: unknown;
  }) | null;

  if (!response.ok) {
    throw new ApiError(body?.message ?? "Request failed.", response.status, body?.errors);
  }

  return body ?? { success: true, data: undefined as T };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const envelope = await requestRaw<T>(path, init);
  return envelope.data;
}

function jsonBody(body: unknown): RequestInit {
  return { body: JSON.stringify(body) };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  getPage: <T>(path: string) => requestRaw<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", ...(body === undefined ? {} : jsonBody(body)) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", ...(body === undefined ? {} : jsonBody(body)) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData }),
  refresh: () => tryRefresh()
};

export function toQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function getApiOrigin(): string {
  if (/^https?:\/\//i.test(API_BASE)) {
    return new URL(API_BASE).origin;
  }

  return window.location.origin;
}

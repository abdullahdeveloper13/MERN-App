import { env } from "./env.js";

function normalizeOrigin(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return withProtocol.replace(/\/+$/, "").toLowerCase();
  }
}

function splitList(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const allowedPatterns = [
  ...splitList(env.CLIENT_URL),
  ...splitList(env.CORS_ORIGINS),
  ...splitList(env.RENDER_EXTERNAL_URL)
]
  .map(normalizeOrigin)
  .filter(Boolean);

function matchesPattern(pattern: string, origin: string): boolean {
  if (!pattern.includes("*")) {
    return pattern === origin;
  }

  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");

  return new RegExp(`^${escaped}$`, "i").test(origin);
}

function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function isOriginAllowed(origin?: string | null): boolean {
  if (!origin) {
    return true;
  }

  const candidate = normalizeOrigin(origin);

  if (!candidate) {
    return false;
  }

  if (allowedPatterns.some((pattern) => matchesPattern(pattern, candidate))) {
    return true;
  }

  if (env.NODE_ENV !== "production" && isLocalOrigin(candidate)) {
    return true;
  }

  return false;
}

export function allowedOrigins(): string[] {
  return [...allowedPatterns];
}

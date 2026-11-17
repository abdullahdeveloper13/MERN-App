import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";
import { parseDurationMs } from "./tokens.js";

export const ACCESS_COOKIE = "hs_access";
export const REFRESH_COOKIE = "hs_refresh";

function isSecureRequest(res: Response): boolean {
  const req = res.req;

  if (!req) {
    return env.NODE_ENV === "production";
  }

  if (req.secure) {
    return true;
  }

  const header = req.headers["x-forwarded-proto"];
  const value = Array.isArray(header) ? header[0] : header;

  return value?.split(",")[0]?.trim().toLowerCase() === "https";
}

function baseCookieOptions(maxAge: number, res: Response): CookieOptions {
  const secure =
    isSecureRequest(res) ||
    env.COOKIE_SECURE === true ||
    (env.COOKIE_SECURE === undefined && env.NODE_ENV === "production");

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const accessMaxAge = parseDurationMs(env.JWT_ACCESS_EXPIRES_IN, 15 * 60_000);
  const refreshMaxAge = parseDurationMs(env.JWT_REFRESH_EXPIRES_IN, 30 * 86_400_000);

  res.cookie(ACCESS_COOKIE, accessToken, baseCookieOptions(accessMaxAge, res));
  res.cookie(REFRESH_COOKIE, refreshToken, baseCookieOptions(refreshMaxAge, res));
}

export function clearAuthCookies(res: Response): void {
  const options = baseCookieOptions(0, res);
  res.clearCookie(ACCESS_COOKIE, { ...options, maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...options, maxAge: undefined });
}

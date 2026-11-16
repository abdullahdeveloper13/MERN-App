import type { CookieOptions, Response } from "express";
import { env } from "../config/env.js";
import { parseDurationMs } from "./tokens.js";

export const ACCESS_COOKIE = "hs_access";
export const REFRESH_COOKIE = "hs_refresh";

function baseCookieOptions(maxAge: number): CookieOptions {
  const secure = env.COOKIE_SECURE ?? env.NODE_ENV === "production";

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

  res.cookie(ACCESS_COOKIE, accessToken, baseCookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE, refreshToken, baseCookieOptions(refreshMaxAge));
}

export function clearAuthCookies(res: Response): void {
  const options = baseCookieOptions(0);
  res.clearCookie(ACCESS_COOKIE, { ...options, maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...options, maxAge: undefined });
}

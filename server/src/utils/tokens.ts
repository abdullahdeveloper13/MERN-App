import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { VerificationToken, type VERIFICATION_TOKEN_TYPES } from "../models/VerificationToken.js";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  type: "access";
}

export function signAccessToken(userId: string, role: UserRole): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign({ sub: userId, role, type: "access" } satisfies AccessTokenPayload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as Partial<AccessTokenPayload>;

  if (payload.type !== "access" || !payload.sub || !payload.role) {
    throw new AppError(401, "Invalid authentication token.");
  }

  return payload as AccessTokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function parseDurationMs(value: string, fallbackMs: number): number {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(value.trim());

  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000
  };

  return amount * (multipliers[unit ?? "d"] ?? 86_400_000);
}

export interface RefreshTokenContext {
  userAgent?: string;
  ipAddress?: string;
}

export async function createRefreshToken(userId: string, context: RefreshTokenContext = {}): Promise<string> {
  const rawToken = randomToken(48);
  const duration = parseDurationMs(env.JWT_REFRESH_EXPIRES_IN, 30 * 86_400_000);

  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(rawToken),
    userAgent: context.userAgent?.slice(0, 300),
    ipAddress: context.ipAddress,
    expiresAt: new Date(Date.now() + duration)
  });

  return rawToken;
}

export async function rotateRefreshToken(
  rawToken: string,
  context: RefreshTokenContext = {}
): Promise<{ userId: string; refreshToken: string }> {
  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash }).select("+tokenHash");

  if (!existing) {
    throw new AppError(401, "Invalid refresh token.");
  }

  if (existing.revokedAt) {
    await RefreshToken.updateMany(
      { user: existing.user, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
    throw new AppError(401, "Refresh token has already been used.");
  }

  if (existing.expiresAt.getTime() <= Date.now()) {
    throw new AppError(401, "Refresh token has expired.");
  }

  const newRawToken = randomToken(48);
  const duration = parseDurationMs(env.JWT_REFRESH_EXPIRES_IN, 30 * 86_400_000);

  existing.revokedAt = new Date();
  existing.replacedByTokenHash = hashToken(newRawToken);
  await existing.save();

  await RefreshToken.create({
    user: existing.user,
    tokenHash: hashToken(newRawToken),
    userAgent: context.userAgent?.slice(0, 300),
    ipAddress: context.ipAddress,
    expiresAt: new Date(Date.now() + duration)
  });

  return { userId: existing.user.toString(), refreshToken: newRawToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
}

export async function createVerificationToken(
  userId: string,
  type: (typeof VERIFICATION_TOKEN_TYPES)[number],
  ttlMs: number
): Promise<string> {
  const rawToken = randomToken(32);

  await VerificationToken.deleteMany({ user: userId, type, usedAt: { $exists: false } });
  await VerificationToken.create({
    user: userId,
    type,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + ttlMs)
  });

  return rawToken;
}

export async function consumeVerificationToken(
  rawToken: string,
  type: (typeof VERIFICATION_TOKEN_TYPES)[number]
): Promise<{ userId: string }> {
  const token = await VerificationToken.findOne({
    tokenHash: hashToken(rawToken),
    type,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  }).select("+tokenHash");

  if (!token) {
    throw new AppError(400, "This link is invalid or has expired.");
  }

  token.usedAt = new Date();
  await token.save();

  return { userId: token.user.toString() };
}

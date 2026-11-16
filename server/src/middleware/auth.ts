import type { NextFunction, Request, Response } from "express";
import { User, type UserRole } from "../models/User.js";
import { ACCESS_COOKIE } from "../utils/cookies.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/tokens.js";

function extractAccessToken(req: Request): string | null {
  const header = req.headers.authorization;

  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }

  const cookieToken = req.cookies?.[ACCESS_COOKIE];

  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  return null;
}

async function loadUser(req: Request, token: string) {
  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub).select("_id name email role isActive").lean();

  if (!user) {
    throw new AppError(401, "Authentication required.");
  }

  if (!user.isActive) {
    throw new AppError(403, "This account has been deactivated.");
  }

  req.user = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name
  };

  return req.user;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      throw new AppError(401, "Authentication required.");
    }

    await loadUser(req, token);
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractAccessToken(req);

    if (token) {
      await loadUser(req, token);
    }

    next();
  } catch {
    next();
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, "Authentication required."));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "You do not have permission to perform this action."));
      return;
    }

    next();
  };
}

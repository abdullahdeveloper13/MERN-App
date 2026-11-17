import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { env } from "../config/env.js";
import { Company } from "../models/Company.js";
import { JobSeekerProfile } from "../models/JobSeekerProfile.js";
import { RecruiterProfile } from "../models/RecruiterProfile.js";
import { User, type UserRole } from "../models/User.js";
import { sendEmailSafe } from "../services/email.service.js";
import { passwordResetEmail, verificationEmail, welcomeEmail } from "../templates/email.js";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "../utils/cookies.js";
import { AppError } from "../utils/AppError.js";
import {
  createRefreshToken,
  createVerificationToken,
  consumeVerificationToken,
  revokeAllRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken
} from "../utils/tokens.js";
import { sendSuccess, sendMessage } from "../utils/response.js";

async function createRoleProfile(userId: string, role: UserRole): Promise<void> {
  if (role === "job_seeker") {
    await JobSeekerProfile.create({ user: userId });
  }

  if (role === "recruiter") {
    await RecruiterProfile.create({ user: userId });
  }
}

async function issueSession(
  user: { _id: unknown; role: UserRole },
  req: Request,
  res: Response
): Promise<string> {
  const userId = String(user._id);
  const accessToken = signAccessToken(userId, user.role);
  const refreshToken = await createRefreshToken(userId, {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip
  });

  setAuthCookies(res, accessToken, refreshToken);

  return accessToken;
}

async function rotateSessionFromCookie(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE];

  if (typeof rawToken !== "string" || rawToken.length === 0) {
    return null;
  }

  try {
    const { userId, refreshToken } = await rotateRefreshToken(rawToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });
    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return null;
    }

    setAuthCookies(res, signAccessToken(user._id.toString(), user.role), refreshToken);
    return user;
  } catch {
    clearAuthCookies(res);
    return null;
  }
}

export async function registerController(req: Request, res: Response) {
  const { name, email, password, role } = req.body as {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  };

  const existingUser = await User.exists({ email });

  if (existingUser) {
    throw new AppError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role });
  await createRoleProfile(user._id.toString(), role);

  const verificationToken = await createVerificationToken(user._id.toString(), "email_verification", 24 * 3_600_000);
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(verificationToken)}`;
  const verification = verificationEmail(user.name, verifyUrl);
  void sendEmailSafe(user.email, verification.subject, verification.html);

  const accessToken = await issueSession(user, req, res);

  return sendSuccess(res, 201, { user, accessToken });
}

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new AppError(403, "This account has been deactivated.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = await issueSession(user, req, res);

  return sendSuccess(res, 200, { user, accessToken });
}

export async function refreshController(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE];

  if (typeof rawToken !== "string" || rawToken.length === 0) {
    return res.status(204).send();
  }

  let rotated: { userId: string; refreshToken: string };

  try {
    rotated = await rotateRefreshToken(rawToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });
  } catch (error) {
    clearAuthCookies(res);
    throw error;
  }

  const user = await User.findById(rotated.userId);

  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw new AppError(401, "Account is unavailable.");
  }

  const accessToken = signAccessToken(user._id.toString(), user.role);
  setAuthCookies(res, accessToken, rotated.refreshToken);

  return sendSuccess(res, 200, { user, accessToken });
}

export async function logoutController(req: Request, res: Response) {
  const rawToken = req.cookies?.[REFRESH_COOKIE];

  if (typeof rawToken === "string" && rawToken.length > 0) {
    await revokeRefreshToken(rawToken);
  }

  clearAuthCookies(res);
  return res.status(204).send();
}

export async function forgotPasswordController(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  const user = await User.findOne({ email });

  if (user) {
    const token = await createVerificationToken(user._id.toString(), "password_reset", 3_600_000);
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;
    const message = passwordResetEmail(user.name, resetUrl);
    void sendEmailSafe(user.email, message.subject, message.html);
  }

  return sendMessage(res, 200, "If an account exists for that email, a reset link has been sent.");
}

export async function resetPasswordController(req: Request, res: Response) {
  const { token, password } = req.body as { token: string; password: string };
  const { userId } = await consumeVerificationToken(token, "password_reset");
  const passwordHash = await bcrypt.hash(password, 12);

  await User.findByIdAndUpdate(userId, { passwordHash });
  await revokeAllRefreshTokens(userId);
  clearAuthCookies(res);

  return sendMessage(res, 200, "Password reset successfully. Please sign in with your new password.");
}

export async function verifyEmailController(req: Request, res: Response) {
  const { token } = req.body as { token: string };
  const { userId } = await consumeVerificationToken(token, "email_verification");
  const user = await User.findByIdAndUpdate(userId, { isEmailVerified: true }, { new: true });

  if (!user) {
    throw new AppError(404, "Account not found.");
  }

  const message = welcomeEmail(user.name);
  void sendEmailSafe(user.email, message.subject, message.html);

  return sendMessage(res, 200, "Email verified successfully.");
}

export async function resendVerificationController(req: Request, res: Response) {
  const { email } = req.body as { email: string };
  const user = await User.findOne({ email });

  if (user && !user.isEmailVerified) {
    const token = await createVerificationToken(user._id.toString(), "email_verification", 24 * 3_600_000);
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;
    const message = verificationEmail(user.name, verifyUrl);
    void sendEmailSafe(user.email, message.subject, message.html);
  }

  return sendMessage(res, 200, "If the account needs verification, a new email has been sent.");
}

export async function meController(req: Request, res: Response) {
  let user = req.user ? await User.findById(req.user.id) : null;

  if (!user) {
    user = await rotateSessionFromCookie(req, res);
  }

  if (!user) {
    return sendSuccess(res, 200, { user: null, profile: null, company: null });
  }

  const [profile, company] =
    user.role === "job_seeker"
      ? [await JobSeekerProfile.findOne({ user: user._id }), null]
      : user.role === "recruiter"
        ? [await RecruiterProfile.findOne({ user: user._id }), null]
        : user.role === "employer"
          ? [null, await Company.findOne({ owner: user._id })]
          : [null, null];

  return sendSuccess(res, 200, { user, profile, company });
}

export async function changePasswordController(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };
  const user = await User.findById(req.user!.id).select("+passwordHash");

  if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new AppError(400, "Current password is incorrect.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  await revokeAllRefreshTokens(user._id.toString());
  clearAuthCookies(res);

  return sendMessage(res, 200, "Password changed. Please sign in again.");
}

export async function googleLoginController(req: Request, res: Response) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError(503, "Google sign-in is not configured.");
  }

  const { credential, role } = req.body as { credential: string; role?: UserRole };
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  let payload: TokenPayload | undefined;

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload() ?? undefined;
  } catch {
    throw new AppError(401, "Google sign-in could not be verified.");
  }

  if (!payload?.email || !payload.email_verified) {
    throw new AppError(401, "Google account email is not verified.");
  }

  let user = await User.findOne({
    $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }]
  });

  if (!user) {
    const randomPassword = await bcrypt.hash(`${payload.sub}-${Date.now()}-${Math.random()}`, 12);
    const assignedRole = role ?? "job_seeker";
    user = await User.create({
      name: payload.name ?? payload.email.split("@")[0],
      email: payload.email.toLowerCase(),
      passwordHash: randomPassword,
      role: assignedRole,
      avatar: payload.picture,
      isEmailVerified: true,
      authProvider: "google",
      googleId: payload.sub
    });
    await createRoleProfile(user._id.toString(), assignedRole);
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    user.isEmailVerified = true;
    if (!user.avatar && payload.picture) {
      user.avatar = payload.picture;
    }
    await user.save();
  }

  if (!user.isActive) {
    throw new AppError(403, "This account has been deactivated.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = await issueSession(user, req, res);

  return sendSuccess(res, 200, { user, accessToken });
}

export function googleConfigController(_req: Request, res: Response) {
  return sendSuccess(res, 200, {
    enabled: Boolean(env.GOOGLE_CLIENT_ID),
    clientId: env.GOOGLE_CLIENT_ID ?? null
  });
}

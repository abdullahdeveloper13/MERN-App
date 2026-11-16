import { z } from "zod";

const publicRoles = ["job_seeker", "employer", "recruiter"] as const;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(128),
    role: z.enum(publicRoles).default("job_seeker")
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(128)
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email()
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8).max(128)
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    token: z.string().min(10)
  })
  .strict();

export const resendVerificationSchema = z
  .object({
    email: z.string().trim().toLowerCase().email()
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128)
  })
  .strict();

export const googleLoginSchema = z
  .object({
    credential: z.string().min(20),
    role: z.enum(publicRoles).optional()
  })
  .strict();

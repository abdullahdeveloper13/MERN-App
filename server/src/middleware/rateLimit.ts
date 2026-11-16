import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const disabled = env.NODE_ENV === "test";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 600,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => disabled,
  message: { success: false, message: "Too many requests. Please try again later." }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 40,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => disabled,
  message: { success: false, message: "Too many authentication attempts. Please try again later." }
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 80,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => disabled,
  message: { success: false, message: "Too many uploads. Please try again later." }
});

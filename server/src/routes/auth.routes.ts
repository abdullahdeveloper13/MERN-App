import { Router } from "express";
import {
  changePasswordController,
  forgotPasswordController,
  googleConfigController,
  googleLoginController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  resendVerificationController,
  resetPasswordController,
  verifyEmailController
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from "../validators/auth.validator.js";

export const authRouter = Router();

authRouter.post("/register", authLimiter, validate({ body: registerSchema }), registerController);
authRouter.post("/login", authLimiter, validate({ body: loginSchema }), loginController);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", logoutController);
authRouter.post("/forgot-password", authLimiter, validate({ body: forgotPasswordSchema }), forgotPasswordController);
authRouter.post("/reset-password", authLimiter, validate({ body: resetPasswordSchema }), resetPasswordController);
authRouter.post("/verify-email", authLimiter, validate({ body: verifyEmailSchema }), verifyEmailController);
authRouter.post(
  "/resend-verification",
  authLimiter,
  validate({ body: resendVerificationSchema }),
  resendVerificationController
);
authRouter.post("/google", authLimiter, validate({ body: googleLoginSchema }), googleLoginController);
authRouter.get("/google/config", googleConfigController);
authRouter.get("/me", authenticate, meController);
authRouter.post(
  "/change-password",
  authenticate,
  authLimiter,
  validate({ body: changePasswordSchema }),
  changePasswordController
);

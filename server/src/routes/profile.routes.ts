import { Router } from "express";
import {
  downloadResumeController,
  getMyProfileController,
  updateAccountController,
  updateMyProfileController,
  uploadAvatarController,
  uploadResumeController
} from "../controllers/profile.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimit.js";
import { uploadAvatar, uploadResume } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import {
  updateAccountSchema,
  updateJobSeekerProfileSchema,
  updateRecruiterProfileSchema
} from "../validators/profile.validator.js";

export const profileRouter = Router();

profileRouter.use(authenticate);

profileRouter.get("/me", getMyProfileController);
profileRouter.patch(
  "/me",
  validate({ body: updateJobSeekerProfileSchema.or(updateRecruiterProfileSchema) }),
  updateMyProfileController
);
profileRouter.patch("/account", validate({ body: updateAccountSchema }), updateAccountController);
profileRouter.post("/me/avatar", uploadLimiter, uploadAvatar, uploadAvatarController);
profileRouter.post("/me/resume", authorize("job_seeker"), uploadLimiter, uploadResume, uploadResumeController);
profileRouter.get("/resume/:userId", downloadResumeController);

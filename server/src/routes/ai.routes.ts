import { Router } from "express";
import {
  aiStatusController,
  improveJobDescriptionController,
  interviewQuestionsController,
  resumeAnalysisController
} from "../controllers/ai.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  interviewQuestionsAiSchema,
  jobDescriptionAiSchema,
  resumeAnalysisAiSchema
} from "../validators/ai.validator.js";

export const aiRouter = Router();

aiRouter.get("/status", aiStatusController);
aiRouter.post(
  "/job-description",
  authenticate,
  authorize("employer", "recruiter", "admin"),
  validate({ body: jobDescriptionAiSchema }),
  improveJobDescriptionController
);
aiRouter.post(
  "/interview-questions",
  authenticate,
  authorize("employer", "recruiter", "admin"),
  validate({ body: interviewQuestionsAiSchema }),
  interviewQuestionsController
);
aiRouter.post(
  "/resume-analysis",
  authenticate,
  authorize("employer", "recruiter", "admin"),
  validate({ body: resumeAnalysisAiSchema }),
  resumeAnalysisController
);

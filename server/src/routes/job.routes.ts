import { Router } from "express";
import {
  createJobController,
  deleteJobController,
  getJobController,
  jobCategoriesController,
  listJobsController,
  listMyJobsController,
  publicJobStatsController,
  updateJobController
} from "../controllers/job.controller.js";
import { authenticate, authorize, optionalAuthenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamsSchema } from "../validators/common.js";
import { createJobSchema, jobListQuerySchema, updateJobSchema } from "../validators/job.validator.js";

export const jobRouter = Router();

jobRouter.get("/", validate({ query: jobListQuerySchema }), listJobsController);
jobRouter.get("/stats", publicJobStatsController);
jobRouter.get("/categories", jobCategoriesController);
jobRouter.get(
  "/mine",
  authenticate,
  authorize("employer", "recruiter", "admin"),
  listMyJobsController
);
jobRouter.get("/:id", optionalAuthenticate, getJobController);

jobRouter.post(
  "/",
  authenticate,
  authorize("employer", "recruiter", "admin"),
  validate({ body: createJobSchema }),
  createJobController
);
jobRouter.patch(
  "/:id",
  authenticate,
  authorize("employer", "recruiter", "admin"),
  validate({ params: idParamsSchema, body: updateJobSchema }),
  updateJobController
);
jobRouter.delete(
  "/:id",
  authenticate,
  authorize("employer", "recruiter", "admin"),
  validate({ params: idParamsSchema }),
  deleteJobController
);

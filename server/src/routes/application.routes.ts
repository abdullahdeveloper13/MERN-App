import { Router } from "express";
import {
  createApplicationController,
  getApplicationController,
  listApplicationsController,
  myApplicationsController,
  updateApplicationStatusController,
  withdrawApplicationController
} from "../controllers/application.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  applicationListQuerySchema,
  createApplicationSchema,
  updateApplicationStatusSchema
} from "../validators/application.validator.js";
import { idParamsSchema } from "../validators/common.js";

export const applicationRouter = Router();

applicationRouter.use(authenticate);

applicationRouter.post(
  "/",
  authorize("job_seeker"),
  validate({ body: createApplicationSchema }),
  createApplicationController
);
applicationRouter.get("/my", authorize("job_seeker"), myApplicationsController);
applicationRouter.get(
  "/",
  authorize("employer", "recruiter", "admin"),
  validate({ query: applicationListQuerySchema }),
  listApplicationsController
);
applicationRouter.get("/:id", validate({ params: idParamsSchema }), getApplicationController);
applicationRouter.patch(
  "/:id/status",
  authorize("employer", "recruiter", "admin"),
  validate({ params: idParamsSchema, body: updateApplicationStatusSchema }),
  updateApplicationStatusController
);
applicationRouter.post(
  "/:id/withdraw",
  authorize("job_seeker"),
  validate({ params: idParamsSchema }),
  withdrawApplicationController
);

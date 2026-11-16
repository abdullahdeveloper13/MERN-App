import { Router } from "express";
import {
  adminAnalyticsController,
  adminAuditLogsController,
  adminListCompaniesController,
  adminListJobsController,
  adminListRecruitersController,
  adminListUsersController,
  adminModerateJobController,
  adminSettingsController,
  adminUpdateRecruiterAssignmentsController,
  adminUpdateUserStatusController,
  adminVerifyCompanyController
} from "../controllers/admin.controller.js";
import { listApplicationsController } from "../controllers/application.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  adminJobQuerySchema,
  adminUserQuerySchema,
  companyVerificationSchema,
  jobModerationSchema,
  recruiterAssignmentsSchema,
  userStatusSchema
} from "../validators/admin.validator.js";
import { idParamsSchema } from "../validators/common.js";

export const adminRouter = Router();

adminRouter.use(authenticate, authorize("admin"));

adminRouter.get("/analytics", adminAnalyticsController);
adminRouter.get("/users", validate({ query: adminUserQuerySchema }), adminListUsersController);
adminRouter.patch(
  "/users/:id/status",
  validate({ params: idParamsSchema, body: userStatusSchema }),
  adminUpdateUserStatusController
);
adminRouter.get("/companies", adminListCompaniesController);
adminRouter.patch(
  "/companies/:id/verify",
  validate({ params: idParamsSchema, body: companyVerificationSchema }),
  adminVerifyCompanyController
);
adminRouter.get("/jobs", validate({ query: adminJobQuerySchema }), adminListJobsController);
adminRouter.patch(
  "/jobs/:id/moderate",
  validate({ params: idParamsSchema, body: jobModerationSchema }),
  adminModerateJobController
);
adminRouter.get("/applications", listApplicationsController);
adminRouter.get("/recruiters", adminListRecruitersController);
adminRouter.patch(
  "/recruiters/:id/assignments",
  validate({ params: idParamsSchema, body: recruiterAssignmentsSchema }),
  adminUpdateRecruiterAssignmentsController
);
adminRouter.get("/audit-logs", adminAuditLogsController);
adminRouter.get("/settings", adminSettingsController);

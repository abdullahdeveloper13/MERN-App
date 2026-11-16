import { Router } from "express";
import {
  createCompanyController,
  createCompanyReviewController,
  deleteCompanyController,
  getCompanyController,
  getMyCompanyController,
  listCompaniesController,
  listCompanyReviewsController,
  updateCompanyController,
  uploadCompanyLogoController
} from "../controllers/company.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimit.js";
import { uploadLogo } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import {
  companyListQuerySchema,
  createCompanySchema,
  createReviewSchema,
  updateCompanySchema
} from "../validators/company.validator.js";
import { idParamsSchema } from "../validators/common.js";

export const companyRouter = Router();

companyRouter.get("/", validate({ query: companyListQuerySchema }), listCompaniesController);
companyRouter.get("/mine", authenticate, getMyCompanyController);
companyRouter.get("/:id", getCompanyController);
companyRouter.get("/:id/reviews", listCompanyReviewsController);

companyRouter.post(
  "/",
  authenticate,
  authorize("employer", "admin"),
  validate({ body: createCompanySchema }),
  createCompanyController
);
companyRouter.patch(
  "/:id",
  authenticate,
  authorize("employer", "admin"),
  validate({ params: idParamsSchema, body: updateCompanySchema }),
  updateCompanyController
);
companyRouter.post(
  "/:id/logo",
  authenticate,
  authorize("employer", "admin"),
  validate({ params: idParamsSchema }),
  uploadLimiter,
  uploadLogo,
  uploadCompanyLogoController
);
companyRouter.post(
  "/:id/reviews",
  authenticate,
  validate({ body: createReviewSchema }),
  createCompanyReviewController
);
companyRouter.delete("/:id", authenticate, authorize("admin"), deleteCompanyController);

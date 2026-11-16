import { Router } from "express";
import {
  listSavedJobsController,
  removeSavedJobController,
  saveJobController
} from "../controllers/savedJob.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { objectIdSchema } from "../validators/common.js";
import { z } from "zod";

export const savedJobRouter = Router();

savedJobRouter.use(authenticate, authorize("job_seeker"));
savedJobRouter.get("/", listSavedJobsController);
savedJobRouter.post("/:jobId", validate({ params: z.object({ jobId: objectIdSchema }) }), saveJobController);
savedJobRouter.delete("/:jobId", validate({ params: z.object({ jobId: objectIdSchema }) }), removeSavedJobController);

import { Router } from "express";
import {
  employerDashboardController,
  jobSeekerDashboardController,
  recruiterDashboardController
} from "../controllers/dashboard.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.get("/job-seeker", authorize("job_seeker"), jobSeekerDashboardController);
dashboardRouter.get("/employer", authorize("employer", "admin"), employerDashboardController);
dashboardRouter.get("/recruiter", authorize("recruiter"), recruiterDashboardController);

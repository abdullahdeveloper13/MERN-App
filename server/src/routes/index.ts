import { Router } from "express";
import { adminRouter } from "./admin.routes.js";
import { aiRouter } from "./ai.routes.js";
import { applicationRouter } from "./application.routes.js";
import { authRouter } from "./auth.routes.js";
import { companyRouter } from "./company.routes.js";
import { conversationRouter } from "./conversation.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { jobRouter } from "./job.routes.js";
import { notificationRouter } from "./notification.routes.js";
import { profileRouter } from "./profile.routes.js";
import { savedJobRouter } from "./savedJob.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/profiles", profileRouter);
apiRouter.use("/companies", companyRouter);
apiRouter.use("/jobs", jobRouter);
apiRouter.use("/applications", applicationRouter);
apiRouter.use("/saved-jobs", savedJobRouter);
apiRouter.use("/conversations", conversationRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/ai", aiRouter);

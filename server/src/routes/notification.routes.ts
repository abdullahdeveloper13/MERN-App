import { Router } from "express";
import {
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamsSchema } from "../validators/common.js";

export const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get("/", listNotificationsController);
notificationRouter.patch("/read-all", markAllNotificationsReadController);
notificationRouter.patch("/:id/read", validate({ params: idParamsSchema }), markNotificationReadController);

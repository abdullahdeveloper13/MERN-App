import type { Request, Response } from "express";
import { Notification } from "../models/Notification.js";
import { AppError } from "../utils/AppError.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";
import { sendSuccess, sendMessage } from "../utils/response.js";

export async function listNotificationsController(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, { limit: 20 });
  const filter = { user: req.user!.id };

  const [notifications, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user!.id, isRead: false })
  ]);

  return sendSuccess(res, 200, { notifications, unread }, buildPaginationMeta(page, limit, total));
}

export async function markNotificationReadController(req: Request, res: Response) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.id },
    { $set: { isRead: true } },
    { new: true }
  );

  if (!notification) {
    throw new AppError(404, "Notification not found.");
  }

  return sendSuccess(res, 200, notification);
}

export async function markAllNotificationsReadController(req: Request, res: Response) {
  await Notification.updateMany({ user: req.user!.id, isRead: false }, { $set: { isRead: true } });
  return sendMessage(res, 200, "All notifications marked as read.");
}

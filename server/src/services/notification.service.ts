import { Notification, type NOTIFICATION_TYPES } from "../models/Notification.js";
import { emitToUser } from "../sockets/index.js";

interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: (typeof NOTIFICATION_TYPES)[number];
  relatedResource?: { type: string; id: string };
}

export async function createNotification(input: NotificationInput) {
  const notification = await Notification.create({
    user: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? "system",
    relatedResource: input.relatedResource
  });

  emitToUser(input.userId, "notification:new", notification.toJSON());

  return notification;
}

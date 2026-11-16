import { Schema, model, type InferSchemaType } from "mongoose";

export const NOTIFICATION_TYPES = ["application", "interview", "message", "job", "system"] as const;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: "system", index: true },
    relatedResource: {
      type: { type: String },
      id: { type: Schema.Types.ObjectId }
    },
    isRead: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const Notification = model("Notification", notificationSchema);

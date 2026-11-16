import { Schema, model, type InferSchemaType } from "mongoose";

const conversationSchema = new Schema(
  {
    participants: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], required: true, index: true },
    relatedJob: { type: Schema.Types.ObjectId, ref: "Job" },
    relatedApplication: { type: Schema.Types.ObjectId, ref: "Application" },
    lastMessage: { type: String, maxlength: 500 },
    lastMessageAt: { type: Date }
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export type ConversationDocument = InferSchemaType<typeof conversationSchema>;
export const Conversation = model("Conversation", conversationSchema);

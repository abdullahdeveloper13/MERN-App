import { z } from "zod";
import { objectIdSchema } from "./common.js";

export const createConversationSchema = z
  .object({
    participantId: objectIdSchema,
    relatedJob: objectIdSchema.optional(),
    relatedApplication: objectIdSchema.optional()
  })
  .strict();

export const sendMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(5000)
  })
  .strict();

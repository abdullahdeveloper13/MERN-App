import { Router } from "express";
import {
  createConversationController,
  listConversationsController,
  listMessagesController,
  markConversationReadController,
  sendMessageController
} from "../controllers/conversation.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamsSchema } from "../validators/common.js";
import { createConversationSchema, sendMessageSchema } from "../validators/message.validator.js";

export const conversationRouter = Router();

conversationRouter.use(authenticate);
conversationRouter.get("/", listConversationsController);
conversationRouter.post("/", validate({ body: createConversationSchema }), createConversationController);
conversationRouter.get("/:id/messages", validate({ params: idParamsSchema }), listMessagesController);
conversationRouter.post(
  "/:id/messages",
  validate({ params: idParamsSchema, body: sendMessageSchema }),
  sendMessageController
);
conversationRouter.patch("/:id/read", validate({ params: idParamsSchema }), markConversationReadController);

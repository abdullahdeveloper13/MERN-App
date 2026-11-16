import type { Request, Response } from "express";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { createNotification } from "../services/notification.service.js";
import { emitToConversation, emitToUser } from "../sockets/index.js";
import { AppError } from "../utils/AppError.js";
import { buildPaginationMeta, getPagination } from "../utils/pagination.js";
import { sendSuccess } from "../utils/response.js";

async function getConversationForUser(conversationId: string, userId: string) {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });

  if (!conversation) {
    throw new AppError(404, "Conversation not found.");
  }

  return conversation;
}

export async function createConversationController(req: Request, res: Response) {
  const { participantId, relatedJob, relatedApplication } = req.body as {
    participantId: string;
    relatedJob?: string;
    relatedApplication?: string;
  };

  if (participantId === req.user!.id) {
    throw new AppError(400, "You cannot start a conversation with yourself.");
  }

  const participant = await User.exists({ _id: participantId, isActive: true });

  if (!participant) {
    throw new AppError(404, "Recipient not found.");
  }

  const existing = await Conversation.findOne({
    participants: { $all: [req.user!.id, participantId], $size: 2 },
    ...(relatedJob ? { relatedJob } : {}),
    ...(relatedApplication ? { relatedApplication } : {})
  });

  if (existing) {
    await existing.populate("participants", "name email avatar role");
    return sendSuccess(res, 200, existing);
  }

  const conversation = await Conversation.create({
    participants: [req.user!.id, participantId],
    relatedJob,
    relatedApplication
  });

  await conversation.populate("participants", "name email avatar role");

  return sendSuccess(res, 201, conversation);
}

export async function listConversationsController(req: Request, res: Response) {
  const conversations = await Conversation.find({ participants: req.user!.id })
    .populate("participants", "name email avatar role")
    .populate("relatedJob", "title slug")
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();

  const conversationIds = conversations.map((conversation) => conversation._id);
  const unreadCounts = await Message.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        conversation: { $in: conversationIds },
        readBy: { $ne: req.user!.id }
      }
    },
    { $group: { _id: "$conversation", count: { $sum: 1 } } }
  ]);
  const unreadMap = new Map(unreadCounts.map((item) => [item._id.toString(), item.count]));

  return sendSuccess(
    res,
    200,
    conversations.map((conversation) => ({
      ...conversation,
      unreadCount: unreadMap.get(conversation._id.toString()) ?? 0
    }))
  );
}

export async function listMessagesController(req: Request, res: Response) {
  const conversation = await getConversationForUser(req.params.id as string, req.user!.id);
  const { page, limit, skip } = getPagination(req.query as Record<string, unknown>, { limit: 30 });

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversation._id })
      .populate("sender", "name avatar role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ conversation: conversation._id })
  ]);

  return sendSuccess(res, 200, messages.reverse(), buildPaginationMeta(page, limit, total));
}

export async function sendMessageController(req: Request, res: Response) {
  const conversation = await getConversationForUser(req.params.id as string, req.user!.id);
  const { content } = req.body as { content: string };

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user!.id,
    content,
    readBy: [req.user!.id]
  });

  conversation.lastMessage = content.slice(0, 500);
  conversation.lastMessageAt = new Date();
  await conversation.save();

  await message.populate("sender", "name avatar role");

  const payload = message.toJSON();
  emitToConversation(conversation._id.toString(), "message:new", payload);

  const otherParticipants = conversation.participants
    .map((participant) => participant.toString())
    .filter((participant) => participant !== req.user!.id);

  await Promise.all(
    otherParticipants.flatMap((participant) => [
      Promise.resolve(emitToUser(participant, "message:new", payload)),
      createNotification({
        userId: participant,
        title: "New message",
        message: `${req.user!.name}: ${content.slice(0, 120)}`,
        type: "message",
        relatedResource: { type: "conversation", id: conversation._id.toString() }
      })
    ])
  );

  return sendSuccess(res, 201, message);
}

export async function markConversationReadController(req: Request, res: Response) {
  const conversation = await getConversationForUser(req.params.id as string, req.user!.id);

  await Message.updateMany(
    { conversation: conversation._id, readBy: { $ne: req.user!.id } },
    { $addToSet: { readBy: req.user!.id } }
  );

  emitToConversation(conversation._id.toString(), "conversation:read", {
    conversationId: conversation._id.toString(),
    userId: req.user!.id
  });

  return sendSuccess(res, 200, { read: true });
}

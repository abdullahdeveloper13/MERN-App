import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { env } from "../config/env.js";
import { Conversation } from "../models/Conversation.js";
import { User } from "../models/User.js";
import { ACCESS_COOKIE } from "../utils/cookies.js";
import { verifyAccessToken } from "../utils/tokens.js";

let io: SocketServer | null = null;

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader.split(";").map((part) => {
      const [name, ...rest] = part.trim().split("=");
      return [name ?? "", decodeURIComponent(rest.join("="))];
    })
  );
}

export function initSocket(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: { origin: env.CLIENT_URL, credentials: true }
  });

  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token;
      const token =
        typeof authToken === "string" && authToken.length > 0
          ? authToken
          : parseCookies(socket.handshake.headers.cookie)[ACCESS_COOKIE];

      if (!token) {
        next(new Error("Authentication required."));
        return;
      }

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select("_id role isActive").lean();

      if (!user?.isActive) {
        next(new Error("Authentication required."));
        return;
      }

      socket.data.userId = user._id.toString();
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error("Authentication required."));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on("conversation:join", async (conversationId: unknown, acknowledge?: (response: object) => void) => {
      try {
        if (typeof conversationId !== "string") {
          throw new Error("Invalid conversation.");
        }

        const conversation = await Conversation.exists({
          _id: conversationId,
          participants: userId
        });

        if (!conversation) {
          throw new Error("Conversation not found.");
        }

        await socket.join(`conversation:${conversationId}`);
        acknowledge?.({ ok: true });
      } catch {
        acknowledge?.({ ok: false });
      }
    });

    socket.on("conversation:leave", (conversationId: unknown) => {
      if (typeof conversationId === "string") {
        void socket.leave(`conversation:${conversationId}`);
      }
    });
  });

  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToConversation(conversationId: string, event: string, payload: unknown): void {
  io?.to(`conversation:${conversationId}`).emit(event, payload);
}

export function getSocketServer(): SocketServer | null {
  return io;
}

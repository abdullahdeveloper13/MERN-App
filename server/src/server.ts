import http from "node:http";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { closeEmailTransport } from "./services/email.service.js";
import { initSocket } from "./sockets/index.js";

export async function createHttpServer() {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  return server;
}

export async function startServer() {
  const server = await createHttpServer();

  server.listen(env.PORT, () => {
     
    console.log(`HireSphere AI API running on http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: string) => {
     
    console.log(`${signal} received. Shutting down gracefully.`);
    server.close(async () => {
      closeEmailTransport();
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return server;
}

import http from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

async function bootstrap() {
  await connectDatabase();
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: env.CLIENT_URL, credentials: true } });

  io.on("connection", (socket) => {
    socket.emit("connected", { message: "HireSphere AI realtime channel ready" });
  });

  server.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

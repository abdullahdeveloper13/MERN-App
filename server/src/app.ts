import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { apiRouter } from "./routes";
import { notFoundHandler, errorHandler } from "./middleware/error";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));
  app.get("/health", (_req, res) => res.json({ ok: true, name: "HireSphere AI API" }));
  app.use("/api/v1", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

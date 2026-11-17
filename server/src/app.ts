import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { env } from "./config/env.js";
import { allowedOrigins, isOriginAllowed } from "./config/origins.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { sanitizeRequest } from "./middleware/sanitize.js";
import { apiRouter } from "./routes/index.js";

const warnedOrigins = new Set<string>();

function warnBlockedOrigin(origin: string): void {
  if (env.NODE_ENV === "test" || warnedOrigins.has(origin)) {
    return;
  }

  warnedOrigins.add(origin);
  console.warn(
    `[cors] Blocked origin "${origin}". Allowed origins: ${allowedOrigins().join(", ") || "none"}. ` +
      "Set CLIENT_URL or CORS_ORIGINS to the deployed client origin."
  );
}

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (isOriginAllowed(origin)) {
          callback(null, true);
          return;
        }

        warnBlockedOrigin(origin as string);
        callback(null, false);
      },
      credentials: true,
      methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      exposedHeaders: ["RateLimit", "RateLimit-Policy", "Retry-After"],
      optionsSuccessStatus: 204,
      maxAge: 86_400
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(cookieParser());
  app.use(sanitizeRequest);
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      name: "HireSphere AI API",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
  });

  app.use("/api", apiLimiter);
  app.use("/api/v1", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

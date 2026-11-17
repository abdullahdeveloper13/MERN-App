import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(currentDir, "../../../.env")
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, quiet: true });
    break;
  }
}

const booleanString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  CORS_ORIGINS: z.string().optional(),
  RENDER_EXTERNAL_URL: z.string().optional(),
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().default("hiresphere"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  COOKIE_SECURE: booleanString.optional(),
  COOKIE_DOMAIN: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("hiresphere"),

  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().default("smtp.resend.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: booleanString.default(true),
  SMTP_USER: z.string().default("resend"),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("onboarding@resend.dev"),

  GOOGLE_CLIENT_ID: z.string().optional(),

  AI_PROVIDER: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_BASE_URL: z.string().optional(),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional()
});

export const env = schema.parse(process.env);

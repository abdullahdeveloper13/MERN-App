import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function signAccessToken(payload: object) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN ?? "15m" });
}

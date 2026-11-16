import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload: object) {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

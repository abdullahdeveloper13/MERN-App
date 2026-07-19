import type { Response } from "express";

export function sendSuccess(res: Response, status: number, data: unknown) {
  return res.status(status).json({ data });
}

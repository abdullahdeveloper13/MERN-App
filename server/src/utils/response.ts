import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(res: Response, status: number, data: T, meta?: PaginationMeta) {
  return res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function sendMessage(res: Response, status: number, message: string) {
  return res.status(status).json({ success: true, message });
}

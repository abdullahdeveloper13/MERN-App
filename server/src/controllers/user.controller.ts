import type { Request, Response } from "express";

export function getMeController(_req: Request, res: Response) {
  res.json({ id: "demo", role: "job_seeker" });
}

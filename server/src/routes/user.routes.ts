import { Router } from "express";

export const userRouter = Router();

userRouter.get("/me", (_req, res) => res.json({ id: "demo", role: "job_seeker" }));

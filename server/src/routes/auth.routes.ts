import { Router } from "express";

export const authRouter = Router();

authRouter.post("/register", (_req, res) => res.status(201).json({ message: "Register endpoint scaffolded" }));
authRouter.post("/login", (_req, res) => res.json({ message: "Login endpoint scaffolded" }));
authRouter.post("/logout", (_req, res) => res.status(204).send());

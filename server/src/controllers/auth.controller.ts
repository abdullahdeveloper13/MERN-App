import type { Request, Response } from "express";

export function registerController(_req: Request, res: Response) {
  res.status(201).json({ message: "Register endpoint scaffolded" });
}

export function loginController(_req: Request, res: Response) {
  res.json({ message: "Login endpoint scaffolded" });
}

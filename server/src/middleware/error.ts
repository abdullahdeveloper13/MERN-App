import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { AppError, isAppError } from "../utils/AppError.js";

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} was not found.`));
}

export function errorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(422).json({
      success: false,
      message: "Database validation failed.",
      errors: Object.values(error.errors).map((item) => item.message)
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, message: "Invalid resource identifier." });
    return;
  }

  const mongoError = error as MongoServerError;

  if (mongoError?.code === 11000) {
    res.status(409).json({
      success: false,
      message: "A record with these details already exists.",
      errors: mongoError.keyValue ? Object.keys(mongoError.keyValue) : undefined
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({ success: false, message: error.message });
    return;
  }

  if (error instanceof Error && (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")) {
    res.status(401).json({ success: false, message: "Invalid or expired authentication token." });
    return;
  }

  if (isAppError(error)) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details ? { errors: error.details } : {})
    });
    return;
  }

  if (env.NODE_ENV !== "test") {
     
    console.error(error);
  }

  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred."
  });
}

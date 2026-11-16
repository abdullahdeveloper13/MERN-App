import type { NextFunction, Request, Response } from "express";

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }

      sanitized[key] = sanitizeValue(nestedValue);
    }

    return sanitized;
  }

  return value;
}

function assignRequestPart(req: Request, part: "body" | "query" | "params", value: unknown): void {
  Object.defineProperty(req, part, {
    value,
    writable: true,
    configurable: true,
    enumerable: true
  });
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    assignRequestPart(req, "body", sanitizeValue(req.body));
  }

  if (req.query && typeof req.query === "object") {
    assignRequestPart(req, "query", sanitizeValue(req.query));
  }

  if (req.params && typeof req.params === "object") {
    assignRequestPart(req, "params", sanitizeValue(req.params));
  }

  next();
}

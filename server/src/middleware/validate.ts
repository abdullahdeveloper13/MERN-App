import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

function assignRequestPart(req: Request, part: "body" | "query" | "params", value: unknown): void {
  Object.defineProperty(req, part, {
    value,
    writable: true,
    configurable: true,
    enumerable: true
  });
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        assignRequestPart(req, "body", schemas.body.parse(req.body));
      }

      if (schemas.query) {
        assignRequestPart(req, "query", schemas.query.parse(req.query));
      }

      if (schemas.params) {
        assignRequestPart(req, "params", schemas.params.parse(req.params));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

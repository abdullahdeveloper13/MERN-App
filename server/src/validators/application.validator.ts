import { z } from "zod";
import { APPLICATION_STATUSES } from "../models/Application.js";
import { objectIdSchema } from "./common.js";

export const createApplicationSchema = z
  .object({
    job: objectIdSchema,
    coverLetter: z.string().trim().max(12000).optional(),
    answers: z
      .array(
        z
          .object({
            question: z.string().trim().min(1).max(300),
            answer: z.string().trim().max(4000)
          })
          .strict()
      )
      .max(20)
      .default([])
  })
  .strict();

export const updateApplicationStatusSchema = z
  .object({
    status: z.enum(APPLICATION_STATUSES),
    recruiterNotes: z.string().trim().max(8000).optional(),
    interviewDetails: z
      .object({
        scheduledAt: z.coerce.date().optional(),
        durationMinutes: z.coerce.number().int().min(15).max(480).optional(),
        mode: z.enum(["video", "phone", "onsite"]).optional(),
        location: z.string().trim().max(300).optional(),
        notes: z.string().trim().max(2000).optional()
      })
      .strict()
      .optional()
  })
  .strict();

export const applicationListQuerySchema = z
  .object({
    job: objectIdSchema.optional(),
    company: objectIdSchema.optional(),
    status: z.enum(APPLICATION_STATUSES).optional(),
    q: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  })
  .strict();

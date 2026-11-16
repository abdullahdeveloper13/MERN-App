import { z } from "zod";
import { USER_ROLES } from "../models/User.js";
import { JOB_STATUSES } from "../models/Job.js";
import { objectIdSchema } from "./common.js";

export const adminUserQuerySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    role: z.enum(USER_ROLES).optional(),
    isActive: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  })
  .strict();

export const userStatusSchema = z
  .object({
    isActive: z.boolean()
  })
  .strict();

export const companyVerificationSchema = z
  .object({
    verified: z.boolean()
  })
  .strict();

export const jobModerationSchema = z
  .object({
    status: z.enum(JOB_STATUSES)
  })
  .strict();

export const recruiterAssignmentsSchema = z
  .object({
    assignedCompanies: z.array(objectIdSchema).max(200).optional(),
    assignedJobs: z.array(objectIdSchema).max(500).optional(),
    assignedCandidates: z.array(objectIdSchema).max(1000).optional()
  })
  .strict();

export const adminJobQuerySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    status: z.enum(JOB_STATUSES).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  })
  .strict();

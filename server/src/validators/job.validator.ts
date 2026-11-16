import { z } from "zod";
import { EXPERIENCE_LEVELS, EMPLOYMENT_TYPES, JOB_STATUSES, WORKPLACE_TYPES } from "../models/Job.js";
import { objectIdSchema } from "./common.js";

const salaryRangeSchema = z
  .object({
    min: z.coerce.number().min(0).optional(),
    max: z.coerce.number().min(0).optional(),
    currency: z.string().trim().length(3).toUpperCase().optional()
  })
  .strict();

const applicationQuestionSchema = z
  .object({
    question: z.string().trim().min(3).max(300),
    required: z.boolean().default(false)
  })
  .strict();

export const jobListQuerySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    location: z.string().trim().max(200).optional(),
    category: z.string().trim().max(120).optional(),
    company: objectIdSchema.optional(),
    employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
    workplaceType: z.enum(WORKPLACE_TYPES).optional(),
    experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
    minSalary: z.coerce.number().min(0).optional(),
    maxSalary: z.coerce.number().min(0).optional(),
    skills: z.string().trim().max(500).optional(),
    sort: z.enum(["newest", "oldest", "salary", "applications"]).default("newest"),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  })
  .strict();

export const createJobSchema = z
  .object({
    title: z.string().trim().min(3).max(180),
    description: z.string().trim().min(20).max(20000),
    responsibilities: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
    requirements: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
    skills: z.array(z.string().trim().min(1).max(80)).max(40).default([]),
    location: z.string().trim().max(200).optional(),
    employmentType: z.enum(EMPLOYMENT_TYPES).default("full_time"),
    workplaceType: z.enum(WORKPLACE_TYPES).default("onsite"),
    salaryRange: salaryRangeSchema.optional(),
    experienceLevel: z.enum(EXPERIENCE_LEVELS).default("mid"),
    category: z.string().trim().max(120).optional(),
    companyId: objectIdSchema,
    status: z.enum(["draft", "published"]).default("draft"),
    applicationDeadline: z.coerce.date().optional(),
    assignedRecruiter: objectIdSchema.optional(),
    applicationQuestions: z.array(applicationQuestionSchema).max(20).default([])
  })
  .strict();

export const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(JOB_STATUSES).optional()
});

export const jobApplicationsQuerySchema = z
  .object({
    status: z.string().trim().max(40).optional(),
    q: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  })
  .strict();

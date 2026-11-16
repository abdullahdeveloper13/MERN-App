import { z } from "zod";
import { COMPANY_SIZES } from "../models/Company.js";

export const companyListQuerySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    industry: z.string().trim().max(120).optional(),
    verified: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
  })
  .strict();

const companyFields = {
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(8000).optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
  industry: z.string().trim().max(120).optional(),
  companySize: z.enum(COMPANY_SIZES).optional(),
  headquarters: z.string().trim().max(200).optional(),
  foundedYear: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional(),
  socialLinks: z
    .object({
      linkedin: z.string().trim().url().optional().or(z.literal("")),
      twitter: z.string().trim().url().optional().or(z.literal("")),
      facebook: z.string().trim().url().optional().or(z.literal(""))
    })
    .strict()
    .optional()
};

export const createCompanySchema = z.object(companyFields).strict();
export const updateCompanySchema = z.object(companyFields).partial().strict();

export const createReviewSchema = z
  .object({
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().max(160).optional(),
    comment: z.string().trim().max(4000).optional()
  })
  .strict();

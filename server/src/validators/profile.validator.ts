import { z } from "zod";

const experienceSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    company: z.string().trim().min(1).max(160),
    location: z.string().trim().max(160).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    current: z.boolean().optional(),
    description: z.string().trim().max(3000).optional()
  })
  .strict();

const educationSchema = z
  .object({
    institution: z.string().trim().min(1).max(200),
    degree: z.string().trim().max(160).optional(),
    fieldOfStudy: z.string().trim().max(160).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    description: z.string().trim().max(2000).optional()
  })
  .strict();

const certificationSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    issuer: z.string().trim().max(200).optional(),
    issueDate: z.coerce.date().optional(),
    credentialUrl: z.string().trim().url().optional().or(z.literal(""))
  })
  .strict();

export const updateJobSeekerProfileSchema = z
  .object({
    headline: z.string().trim().max(180).optional(),
    professionalSummary: z.string().trim().max(5000).optional(),
    skills: z.array(z.string().trim().min(1).max(80)).max(60).optional(),
    experience: z.array(experienceSchema).max(20).optional(),
    education: z.array(educationSchema).max(20).optional(),
    certifications: z.array(certificationSchema).max(30).optional(),
    portfolio: z.string().trim().url().optional().or(z.literal("")),
    linkedinUrl: z.string().trim().url().optional().or(z.literal("")),
    githubUrl: z.string().trim().url().optional().or(z.literal("")),
    preferredJobTypes: z.array(z.string().trim().max(60)).max(15).optional(),
    preferredLocations: z.array(z.string().trim().max(120)).max(15).optional(),
    salaryExpectation: z
      .object({
        amount: z.coerce.number().min(0).optional(),
        currency: z.string().trim().length(3).toUpperCase().optional(),
        period: z.enum(["hourly", "monthly", "yearly"]).optional()
      })
      .strict()
      .optional()
  })
  .strict();

export const updateRecruiterProfileSchema = z
  .object({
    specialization: z.string().trim().max(200).optional(),
    experienceYears: z.coerce.number().int().min(0).max(60).optional()
  })
  .strict();

export const updateAccountSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: z.string().trim().max(30).optional(),
    location: z.string().trim().max(200).optional()
  })
  .strict();

import { z } from "zod";

export const jobDescriptionAiSchema = z
  .object({
    description: z.string().trim().min(40).max(15000)
  })
  .strict();

export const interviewQuestionsAiSchema = z
  .object({
    jobDescription: z.string().trim().min(40).max(15000)
  })
  .strict();

export const resumeAnalysisAiSchema = z
  .object({
    resumeText: z.string().trim().min(50).max(30000),
    jobDescription: z.string().trim().min(40).max(15000)
  })
  .strict();

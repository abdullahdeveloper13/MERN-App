import type { Request, Response } from "express";
import { getAIService } from "../adapters/ai/AIService.js";
import { sendSuccess } from "../utils/response.js";

export function aiStatusController(_req: Request, res: Response) {
  const ai = getAIService();
  return sendSuccess(res, 200, {
    configured: ai.isConfigured(),
    provider: ai.getProviderName()
  });
}

export async function improveJobDescriptionController(req: Request, res: Response) {
  const result = await getAIService().improveJobDescription(req.body.description as string);
  return sendSuccess(res, 200, { result });
}

export async function interviewQuestionsController(req: Request, res: Response) {
  const result = await getAIService().suggestInterviewQuestions(req.body.jobDescription as string);
  return sendSuccess(res, 200, { result });
}

export async function resumeAnalysisController(req: Request, res: Response) {
  const result = await getAIService().analyzeResume(
    req.body.resumeText as string,
    req.body.jobDescription as string
  );
  return sendSuccess(res, 200, { result });
}

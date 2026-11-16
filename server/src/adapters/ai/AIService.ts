import {
  INTERVIEW_QUESTIONS_SYSTEM_PROMPT,
  JOB_DESCRIPTION_SYSTEM_PROMPT,
  RESUME_ANALYSIS_SYSTEM_PROMPT
} from "./prompts.js";
import { OpenAICompatibleProvider } from "./providers/OpenAICompatibleProvider.js";
import type { AIProvider } from "./AIProvider.js";

export class AIService {
  constructor(private readonly provider: AIProvider = new OpenAICompatibleProvider()) {}

  isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  getProviderName(): string {
    return this.provider.name;
  }

  improveJobDescription(description: string): Promise<string> {
    return this.provider.complete({
      systemPrompt: JOB_DESCRIPTION_SYSTEM_PROMPT,
      userPrompt: description,
      temperature: 0.3
    });
  }

  analyzeResume(resumeText: string, jobDescription: string): Promise<string> {
    return this.provider.complete({
      systemPrompt: RESUME_ANALYSIS_SYSTEM_PROMPT,
      userPrompt: `JOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resumeText}`,
      temperature: 0.2
    });
  }

  suggestInterviewQuestions(jobDescription: string): Promise<string> {
    return this.provider.complete({
      systemPrompt: INTERVIEW_QUESTIONS_SYSTEM_PROMPT,
      userPrompt: jobDescription,
      temperature: 0.5
    });
  }
}

let service: AIService | null = null;

export function getAIService(): AIService {
  service ??= new AIService();
  return service;
}

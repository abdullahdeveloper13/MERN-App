import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/AppError.js";
import type { AICompletionRequest, AIProvider } from "../AIProvider.js";

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export class OpenAICompatibleProvider implements AIProvider {
  readonly name: string;
  private readonly baseUrl: string;

  constructor() {
    this.name = env.AI_PROVIDER ?? "openai-compatible";
    this.baseUrl = (env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  }

  isConfigured(): boolean {
    return Boolean(env.AI_API_KEY && env.AI_MODEL);
  }

  async complete(request: AICompletionRequest): Promise<string> {
    if (!this.isConfigured()) {
      throw new AppError(503, "AI features are not configured.");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        temperature: request.temperature ?? 0.4,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt }
        ]
      })
    });

    if (!response.ok) {
      throw new AppError(502, "The AI provider returned an error.");
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new AppError(502, "The AI provider returned an empty response.");
    }

    return content;
  }
}

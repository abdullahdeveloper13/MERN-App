export interface AICompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  complete(request: AICompletionRequest): Promise<string>;
}

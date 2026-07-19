export interface AIProvider {
  resumeAnalysis(input: string): Promise<string>;
  jobDescription(input: string): Promise<string>;
}

export class MockAIProvider implements AIProvider {
  async resumeAnalysis(input: string) {
    return `AI-ready resume analysis placeholder for: ${input.slice(0, 80)}`;
  }

  async jobDescription(input: string) {
    return `AI-ready job description placeholder for: ${input.slice(0, 80)}`;
  }
}

import { Agent } from './types';

export interface LlmClient {
  generate(agent: Agent): Promise<string>;
}

export class MockLlmClient implements LlmClient {
  async generate(agent: Agent): Promise<string> {
    console.log(`[MockLlmClient] Received prompt: ${agent.prompt}`);
    // Simulate a response from the LLM
    const response = 'Based on your request, here are the commands to execute:\n```bash\necho "hello world" > README.md\ngit add .\ngit commit -m "Update README.md"\ngit push origin ' + agent.worktree!.branch + '\n```';
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    console.log(`[MockLlmClient] Sending response`);
    return response;
  }
}

export function getLlmClient(llm: string): LlmClient {
    if (llm === 'mock') {
        return new MockLlmClient();
    }
    // In the future, we can add more clients here
    // e.g. if (llm === 'gemini') return new GeminiClient();
    throw new Error(`Unsupported LLM: ${llm}`);
}

import { getAgentSession } from '@/lib/gemini';
import { SandboxManager } from '@/lib/sandbox/manager';
import { CodeReview, CodeReviewSchema } from '@/types/agent';

export class CriticAgent {
  async review(taskId: string, customApiKey?: string): Promise<CodeReview> {
    const fs = SandboxManager.get(taskId);
    if (!fs) throw new Error('Sandbox not found');

    const chat = await getAgentSession('Critic', customApiKey);
    const diff = fs.getDiff();
    
    const prompt = `
      Review the following code changes in the sandbox:
      
      Diff:
      ${diff}

      Instructions:
      1. Analyze the changes for syntax errors, logic bugs, and security vulnerabilities.
      2. Respond ONLY with a JSON object following the CodeReview schema.
      
      Schema:
      {
        "status": "APPROVED" | "REQUEST_CHANGES",
        "severity": "LOW" | "MEDIUM" | "BLOCKER",
        "comments": ["comment 1", "comment 2"]
      }
    `;

    const result = await chat.sendMessage({ message: prompt });
    const text = result.text || '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(jsonStr);
      
      return CodeReviewSchema.parse(parsed);
    } catch (error) {
      console.error('Critic Review Error:', error, 'Raw:', text);
      throw new Error('Failed to parse Critic response');
    }
  }
}

import { executeAgent } from '@/lib/agent-runner';
import { SandboxManager } from '@/lib/sandbox/manager';
import { Verdict, VerdictSchema, CodeReview } from '@/types/agent';

export class JudgeAgent {
  async evaluate(taskId: string, reviews: CodeReview[], modelId: string, customApiKey?: string): Promise<Verdict> {
    const fs = SandboxManager.get(taskId);
    if (!fs) throw new Error('Sandbox not found');

    const diff = fs.getDiff();
    
    const prompt = `
      As the Judge, evaluate the final state of the task and the debate between the Coder and Critic.
      
      Task ID: ${taskId}
      Code Diff:
      ${diff}

      Review History:
      ${JSON.stringify(reviews, null, 2)}

      Instructions:
      1. Decide if the code is ready for merge (PASS) or if it fails (FAIL).
      2. If there are any BLOCKER issues from the Critic, you MUST return FAIL.
      3. Respond ONLY with a JSON object following the Verdict schema.
      
      Schema:
      {
        "taskId": "${taskId}",
        "status": "PASS" | "FAIL",
        "summary": "Brief summary of the decision",
        "filesModified": ["file1", "file2"]
      }
    `;

    const text = await executeAgent(modelId, 'Judge', prompt, customApiKey);

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(jsonStr);
      
      return VerdictSchema.parse(parsed);
    } catch (error) {
      console.error('Judge Verdict Error:', error, 'Raw:', text);
      throw new Error('Failed to parse Judge response');
    }
  }
}

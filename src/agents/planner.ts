import { executeAgent } from '@/lib/agent-runner';
import { PlanArtifactSchema, PlannerEvent } from '@/types/agent';

export class PlannerAgent {
  async analyze(userInput: string, modelId: string, customApiKey?: string): Promise<PlannerEvent> {
    const prompt = `
      Analyze the following user request: "${userInput}".
      
      Your goal is to either:
      1. Request clarification if the request is ambiguous or lacks technical details.
      2. Generate a detailed technical plan (plan.md) if the request is clear.
      
      Respond ONLY with a JSON object following one of these formats:
      
      For clarification:
      {
        "type": "CLARIFY",
        "questions": ["Question 1", "Question 2"]
      }
      
      For plan generation:
      {
        "type": "PLAN_GENERATED",
        "payload": {
          "version": "1.0.0",
          "tasks": [
            { "id": 1, "title": "Task Title", "description": "Detailed description", "file_path": "path/to/file", "action": "CREATE" }
          ],
          "affectedFiles": ["file1", "file2"],
          "techStack": ["Next.js", "Tailwind"],
          "markdown": "# Plan\\n\\nDetailed plan in markdown..."
        }
      }
      
      Ensure the JSON is valid and strictly follows the schema.
    `;

    const text = await executeAgent(modelId, 'Planner', prompt, customApiKey);
    
    try {
      // Extract JSON from potential markdown blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(jsonStr);
      
      if (parsed.type === 'PLAN_GENERATED') {
        const validatedPayload = PlanArtifactSchema.parse(parsed.payload);
        return { type: 'PLAN_GENERATED', payload: validatedPayload };
      } else if (parsed.type === 'CLARIFY') {
        return { type: 'CLARIFY', questions: parsed.questions || [] };
      }
      
      throw new Error('Invalid response type from Planner');
    } catch (error) {
      console.error('Planner Parsing Error:', error, 'Raw text:', text);
      throw new Error('Failed to parse Planner response');
    }
  }
}

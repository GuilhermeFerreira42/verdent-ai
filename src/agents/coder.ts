import { getAgentSession } from '@/lib/gemini';
import { SandboxManager } from '@/lib/sandbox/manager';
import { PlanArtifact } from '@/types/agent';

export class CoderAgent {
  async executeTask(taskId: string, plan: PlanArtifact, taskIndex: number, customApiKey?: string): Promise<string> {
    const fs = SandboxManager.get(taskId);
    if (!fs) throw new Error('Sandbox not found');

    const task = plan.tasks[taskIndex];
    if (!task) throw new Error(`Task index ${taskIndex} not found in plan`);

    const chat = await getAgentSession('Coder', customApiKey);
    const currentFiles = fs.listFiles();
    
    const prompt = `
      Execute the following task from the plan:
      Task ID: ${task.id}
      Title: ${task.title}
      Description: ${task.description}
      Action: ${task.action}
      File Path: ${task.file_path}

      Plan Context: ${JSON.stringify(plan)}
      Current Files in Sandbox: ${currentFiles.join(', ')}

      Instructions:
      1. Write the code for this task.
      2. Respond ONLY with a JSON object containing the file path and the full content.
      
      Format:
      {
        "file_path": "path/to/file",
        "content": "full file content here"
      }
    `;

    const result = await chat.sendMessage({ message: prompt });
    const text = result.text || '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(jsonStr);
      
      const writeResult = fs.writeFile(parsed.file_path, parsed.content, 'Coder');
      if (!writeResult.success) {
        return `Error writing to sandbox: ${writeResult.error}`;
      }

      return `Task ${task.id} implemented in ${parsed.file_path}`;
    } catch (error) {
      console.error('Coder Execution Error:', error, 'Raw:', text);
      return `Failed to parse Coder response: ${text}`;
    }
  }
}

import { promises as fs } from 'fs';
import path from 'path';
import { SandboxManager } from './manager';

export class Committer {
  static async merge(taskId: string): Promise<{ success: boolean; error?: string }> {
    const sandbox = SandboxManager.get(taskId);
    if (!sandbox) return { success: false, error: 'Sandbox not found' };

    try {
      const files = sandbox.listFiles();
      for (const filePath of files) {
        const contentResponse = sandbox.readFile(filePath, 'Committer');
        if (contentResponse.success && contentResponse.data) {
          // The filePath in sandbox is like /sandboxes/task-id/src/app/page.tsx
          // We need to map it back to the project root.
          // Assuming the sandbox root is /sandboxes/taskId, we strip that prefix.
          const relativePath = filePath.replace(sandbox.context.rootPath, '');
          const targetPath = path.join(process.cwd(), relativePath);
          
          // Ensure directory exists
          await fs.mkdir(path.dirname(targetPath), { recursive: true });
          
          // Write to real filesystem
          await fs.writeFile(targetPath, contentResponse.data, 'utf-8');
          console.log(`[COMMITTER] Merged ${filePath} to ${targetPath}`);
        }
      }
      return { success: true };
    } catch (error: any) {
      console.error('[COMMITTER] Merge failed:', error);
      return { success: false, error: error.message };
    }
  }
}

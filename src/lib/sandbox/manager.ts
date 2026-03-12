import { SandboxContext } from './types';
import { FSEngine } from './fs-engine';

export class SandboxManager {
  private static instances: Map<string, SandboxContext> = new Map();

  static create(taskId: string): FSEngine {
    if (this.instances.has(taskId)) {
      return new FSEngine(this.instances.get(taskId)!);
    }

    const rootPath = `/sandboxes/${taskId}`;
    const context: SandboxContext = {
      taskId,
      rootPath,
      createdAt: Date.now(),
      files: new Map(),
      logs: [],
    };

    this.instances.set(taskId, context);
    console.log(`[SANDBOX] Provisioned: ${taskId} at ${rootPath}`);
    
    return new FSEngine(context);
  }

  static get(taskId: string): FSEngine | null {
    const context = this.instances.get(taskId);
    return context ? new FSEngine(context) : null;
  }

  static destroy(taskId: string): boolean {
    return this.instances.delete(taskId);
  }

  static purge(taskId: string): boolean {
    const context = this.instances.get(taskId);
    if (!context) return false;
    
    // In a real FS we would delete the directory. 
    // In our VFS, deleting from memory is enough.
    console.log(`[SANDBOX] Purging: ${taskId}`);
    return this.instances.delete(taskId);
  }

  static getAllLogs(taskId: string) {
    return this.instances.get(taskId)?.logs || [];
  }
}

import { SandboxContext, FileEvent, FSResponse } from './types';

export class FSEngine {
  public context: SandboxContext;

  constructor(context: SandboxContext) {
    this.context = context;
  }

  private validatePath(path: string): boolean {
    // Prevent path traversal
    if (path.includes('..') || path.startsWith('/') && !path.startsWith(this.context.rootPath)) {
      return false;
    }
    // Ensure it's within the sandbox root
    if (!path.startsWith(this.context.rootPath)) {
      return false;
    }
    return true;
  }

  private logEvent(event: Omit<FileEvent, 'timestamp'>) {
    this.context.logs.push({
      ...event,
      timestamp: Date.now(),
    });
  }

  public writeFile(path: string, content: string, agent: string = 'Coder'): FSResponse {
    if (!this.validatePath(path)) {
      return { success: false, error: 'Violação de Escopo: Acesso negado fora do sandbox.' };
    }

    const action = this.context.files.has(path) ? 'UPDATE' : 'CREATE';
    this.context.files.set(path, content);
    
    this.logEvent({
      agent,
      action,
      path,
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
    });

    return { success: true };
  }

  public readFile(path: string, agent: string = 'System'): FSResponse {
    if (!this.validatePath(path)) {
      return { success: false, error: 'Violação de Escopo: Acesso negado.' };
    }

    const content = this.context.files.get(path);
    if (content === undefined) {
      return { success: false, error: 'Arquivo não encontrado.' };
    }

    this.logEvent({ agent, action: 'READ', path });
    return { success: true, data: content };
  }

  public deleteFile(path: string, agent: string = 'Coder'): FSResponse {
    if (!this.validatePath(path)) {
      return { success: false, error: 'Violação de Escopo.' };
    }

    if (!this.context.files.has(path)) {
      return { success: false, error: 'Arquivo não encontrado.' };
    }

    this.context.files.delete(path);
    this.logEvent({ agent, action: 'DELETE', path });
    return { success: true };
  }

  public listFiles(): string[] {
    return Array.from(this.context.files.keys());
  }

  public getDiff(): string {
    // Simplified diff implementation
    let diff = '';
    this.context.files.forEach((content, path) => {
      diff += `--- ${path}\n+++ ${path}\n@@ -0,0 +1,${content.split('\n').length} @@\n`;
      diff += content.split('\n').map(line => `+${line}`).join('\n') + '\n';
    });
    return diff;
  }
}

export interface SandboxContext {
  taskId: string;
  rootPath: string;
  createdAt: number;
  files: Map<string, string>; // path -> content
  logs: FileEvent[];
}

export interface FileEvent {
  timestamp: number;
  agent: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  path: string;
  content?: string;
}

export interface FSResponse {
  success: boolean;
  error?: string;
  data?: any;
}

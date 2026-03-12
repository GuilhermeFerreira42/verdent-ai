import { z } from 'zod';

export type Role = 'user' | 'assistant' | 'system';

export interface MessageHistory {
  role: Role;
  content: string;
  agentId?: string;
}

export interface ContextCacheMetadata {
  cacheName: string;
  ttl: number;
  fingerprint: string;
}

// JSON-RPC 2.0 Schema
export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.any().optional(),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
});

export const JsonRpcResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }).optional(),
  id: z.union([z.string(), z.number(), z.null()]),
});

export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;
export type JsonRpcResponse = z.infer<typeof JsonRpcResponseSchema>;

// Phase 2: Planning Types
export type PlanState = 'IDLE' | 'CLARIFYING' | 'PLANNING' | 'REVIEWING' | 'APPROVED' | 'CODING' | 'VERIFYING';

export const PlanArtifactSchema = z.object({
  version: z.string(),
  tasks: z.array(z.object({
    id: z.number(),
    title: z.string(),
    description: z.string(),
    file_path: z.string().optional(),
    action: z.enum(['CREATE', 'MODIFY', 'DELETE', 'UPDATE']).optional(),
  })),
  affectedFiles: z.array(z.string()),
  techStack: z.array(z.string()),
  markdown: z.string(), // The plan in markdown format for rendering
});

export type PlanArtifact = z.infer<typeof PlanArtifactSchema>;

export type PlannerEvent = 
  | { type: 'CLARIFY', questions: string[] }
  | { type: 'PLAN_GENERATED', payload: PlanArtifact };

// Phase 4: Coding & Verification Types
export const CodeReviewSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REQUEST_CHANGES']),
  severity: z.enum(['LOW', 'MEDIUM', 'BLOCKER']),
  comments: z.array(z.string()),
});

export type CodeReview = z.infer<typeof CodeReviewSchema>;

export const VerdictSchema = z.object({
  taskId: z.string(),
  status: z.enum(['PASS', 'FAIL']),
  summary: z.string(),
  filesModified: z.array(z.string()),
});

export type Verdict = z.infer<typeof VerdictSchema>;

// Phase 5: Telemetry & Post-Mortem Types
export interface AgentMetric {
  agentRole: string;
  durationMs: number;
  tokenUsage: {
    prompt: number;
    completion: number;
  };
  iterations: number;
}

export interface PostMortem {
  taskId: string;
  totalDuration: number;
  totalTokens: number;
  agentMetrics: AgentMetric[];
  status: 'SUCCESS' | 'FAILED';
  filesModified: string[];
}

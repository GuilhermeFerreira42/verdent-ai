import { AgentMetric } from '@/types/agent';

export class TelemetryTracker {
  private static instance: TelemetryTracker;
  private metrics: Map<string, AgentMetric[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): TelemetryTracker {
    if (!TelemetryTracker.instance) {
      TelemetryTracker.instance = new TelemetryTracker();
    }
    return TelemetryTracker.instance;
  }

  startTimer(taskId: string, agentRole: string) {
    const key = `${taskId}:${agentRole}`;
    this.startTimes.set(key, Date.now());
  }

  stopTimer(taskId: string, agentRole: string, tokens: { prompt: number; completion: number }) {
    const key = `${taskId}:${agentRole}`;
    const startTime = this.startTimes.get(key);
    if (!startTime) return;

    const durationMs = Date.now() - startTime;
    const metric: AgentMetric = {
      agentRole,
      durationMs,
      tokenUsage: tokens,
      iterations: 1, // Simplified for now
    };

    const taskMetrics = this.metrics.get(taskId) || [];
    taskMetrics.push(metric);
    this.metrics.set(taskId, taskMetrics);
    this.startTimes.delete(key);
  }

  getMetrics(taskId: string): AgentMetric[] {
    return this.metrics.get(taskId) || [];
  }

  clear(taskId: string) {
    this.metrics.delete(taskId);
    // Also clear any dangling timers for this task
    for (const key of Array.from(this.startTimes.keys())) {
      if (key.startsWith(`${taskId}:`)) {
        this.startTimes.delete(key);
      }
    }
  }
}

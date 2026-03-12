import { PostMortem, AgentMetric } from '@/types/agent';
import { TelemetryTracker } from '../telemetry/tracker';
import { SandboxManager } from '../sandbox/manager';

export class PostMortemReporter {
  static generate(taskId: string, status: 'SUCCESS' | 'FAILED', filesModified: string[]): PostMortem {
    const tracker = TelemetryTracker.getInstance();
    const metrics = tracker.getMetrics(taskId);
    
    const totalDuration = metrics.reduce((acc, m) => acc + m.durationMs, 0);
    const totalTokens = metrics.reduce((acc, m) => acc + m.tokenUsage.prompt + m.tokenUsage.completion, 0);

    const report: PostMortem = {
      taskId,
      totalDuration,
      totalTokens,
      agentMetrics: metrics,
      status,
      filesModified,
    };

    // Save to sandbox as session_summary.json
    const fs = SandboxManager.get(taskId);
    if (fs) {
      fs.writeFile(`${fs.context.rootPath}/session_summary.json`, JSON.stringify(report, null, 2), 'System');
    }

    return report;
  }
}

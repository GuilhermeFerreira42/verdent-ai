'use client';

import { PostMortem } from '@/types/agent';
import { CheckCircle2, Clock, Cpu, FileJson, Hash, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface CompletionViewProps {
  report: PostMortem;
  onReset: () => void;
}

export default function CompletionView({ report, onReset }: CompletionViewProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl"
    >
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Tarefa Concluída com Sucesso</h2>
        <p className="text-zinc-500 mt-2">O tribunal encerrou a sessão e as mudanças foram aplicadas.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <MetricCard 
          icon={<Clock className="w-4 h-4 text-blue-400" />} 
          label="Duração Total" 
          value={`${(report.totalDuration / 1000).toFixed(1)}s`} 
        />
        <MetricCard 
          icon={<Zap className="w-4 h-4 text-amber-400" />} 
          label="Tokens Utilizados" 
          value={report.totalTokens.toLocaleString()} 
        />
        <MetricCard 
          icon={<Cpu className="w-4 h-4 text-purple-400" />} 
          label="Agentes Ativos" 
          value={report.agentMetrics.length.toString()} 
        />
        <MetricCard 
          icon={<Hash className="w-4 h-4 text-emerald-400" />} 
          label="Arquivos Modificados" 
          value={report.filesModified.length.toString()} 
        />
      </div>

      <div className="space-y-4 mb-8">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Métricas por Agente</h3>
        <div className="space-y-2">
          {report.agentMetrics.map((metric, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
              <span className="text-sm font-medium text-zinc-300">{metric.agentRole}</span>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>{(metric.durationMs / 1000).toFixed(1)}s</span>
                <span>{metric.tokenUsage.prompt + metric.tokenUsage.completion} tokens</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => {
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `post-mortem-${report.taskId}.json`;
            a.click();
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors text-sm font-medium"
        >
          <FileJson className="w-4 h-4" /> Baixar Relatório
        </button>
        <button 
          onClick={onReset}
          className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          Nova Tarefa
        </button>
      </div>
    </motion.div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <div className="text-xl font-semibold text-zinc-200">{value}</div>
    </div>
  );
}

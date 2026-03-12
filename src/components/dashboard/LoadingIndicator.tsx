'use client';

import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingIndicatorProps {
  isLoading: boolean;
  agent?: string;
  step?: string;
}

export default function LoadingIndicator({ isLoading, agent, step }: LoadingIndicatorProps) {
  const getStepMessage = () => {
    switch (step) {
      case 'PLANNING': return 'Planner está decompondo requisitos e gerando arquitetura...';
      case 'CODING': return 'Coder está implementando as mudanças no sandbox...';
      case 'REVIEWING': return 'Critic está realizando análise estática e lógica do código...';
      case 'JUDGING': return 'Judge está avaliando o debate e emitindo o veredito final...';
      case 'COMMITTING': return 'System está realizando o merge das mudanças para o sistema principal...';
      case 'CHATTING': return 'Supervisor está processando sua mensagem...';
      default: return 'Processando requisição agêntica...';
    }
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-24 right-8 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl"
        >
          <div className="relative">
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            <div className="absolute inset-0 bg-emerald-500/20 blur-sm rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
              {agent || 'Agente Ativo'}
            </span>
            <span className="text-xs text-zinc-300 font-medium">
              {getStepMessage()}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

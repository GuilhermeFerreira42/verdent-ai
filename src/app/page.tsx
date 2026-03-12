'use client';

import { useState, useRef, useEffect } from 'react';
import { Terminal, Code2, MessageSquare, Play, CheckCircle, Loader2, Shield, Send, Settings, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PlanState, PlanArtifact, PostMortem } from '@/types/agent';
import CompletionView from '@/components/dashboard/CompletionView';
import LoadingIndicator from '@/components/dashboard/LoadingIndicator';

interface Message {
  agent: string;
  role: string;
  message: string;
}

interface Log {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

interface LLMModel {
  id: string;
  name: string;
  provider: string;
  isLocal: boolean;
}

export default function Dashboard() {
  const [phase, setPhase] = useState<PlanState>('IDLE');
  const [messages, setMessages] = useState<Message[]>([
    { agent: 'Supervisor', role: 'System', message: 'Iniciando sessão. Qual é o requisito técnico?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<PlanArtifact | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [sandboxLogs, setSandboxLogs] = useState<any[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(-1);
  const [executionResults, setExecutionResults] = useState<any[]>([]);
  const [postMortem, setPostMortem] = useState<PostMortem | null>(null);
  const [currentAgent, setCurrentAgent] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState<string | undefined>();

  // UI Interaction States
  const [activeView, setActiveView] = useState<'PLAN' | 'FILE'>('PLAN');
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);
  const [isFetchingFile, setIsFetchingFile] = useState(false);

  // Phase X: API Key Management
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'IDLE' | 'VALIDATING' | 'READY' | 'ERROR'>('IDLE');
  const [systemLogs, setSystemLogs] = useState<Log[]>([]);
  const [modelId, setModelId] = useState('gemini-1.5-flash');
  const [availableModels, setAvailableModels] = useState<LLMModel[]>([
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', isLocal: false },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', isLocal: false }
  ]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { 
    setIsMounted(true); 
    const savedModel = localStorage.getItem('verdent_model_id');
    if (savedModel) setModelId(savedModel);
    
    // Fetch available models
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'listModels' })
        });
        const data = await response.json();
        if (data.models) {
          setAvailableModels(data.models);
          addLog('info', `Descobertos ${data.models.length} modelos (Geral + Locais).`);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        addLog('warning', 'Falha ao descobrir modelos locais.');
      }
    };
    fetchModels();
  }, []);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setModelId(newModel);
    localStorage.setItem('verdent_model_id', newModel);
    addLog('info', `Modelo alterado para: ${newModel}`);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: Log['type'], message: string) => {
    setSystemLogs(prev => [...prev, { id: Date.now().toString(), type, message, timestamp: Date.now() }]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [systemLogs]);

  const handleValidateKey = async () => {
    if (!apiKey.trim()) {
      addLog('warning', 'Chave vazia. O sistema usará o Segredo (Secret) configurado no ambiente.');
      setSystemStatus('READY');
      setIsSettingsOpen(false);
      return;
    }

    setSystemStatus('VALIDATING');
    addLog('info', 'A validar chave de API...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': apiKey
        },
        body: JSON.stringify({ action: 'validate', modelId })
      });

      if (response.ok) {
        setSystemStatus('READY');
        addLog('info', 'Chave de API validada com sucesso.');
        setIsSettingsOpen(false);
      } else {
        const errorData = await response.json();
        setSystemStatus('ERROR');
        addLog('error', `Falha na validação: ${errorData.error || 'Chave inválida'}`);
      }
    } catch (error) {
      setSystemStatus('ERROR');
      addLog('error', 'Erro de conexão ao validar a chave.');
    }
  };

  // Poll for sandbox logs
  useEffect(() => {
    if (!taskId || phase === 'IDLE') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'x-gemini-key': apiKey } : {})
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'getLogs',
            params: { taskId },
            id: Date.now()
          })
        });
        const data = await response.json();
        if (data.result) {
          setSandboxLogs(data.result);
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [taskId, phase, apiKey]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { agent: 'User', role: 'User', message: userMessage }]);
    setIsLoading(true);
    setCurrentAgent(undefined);
    setCurrentStep(undefined);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-key': apiKey } : {})
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'sendMessage',
          params: { message: userMessage, state: phase, taskId: taskId || 'global' },
          id: Date.now(),
          modelId
        })
      });

      if (!response.body) throw new Error('No response body');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erro na requisição');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const data = JSON.parse(line);

          if (data.result) {
            const result = data.result;
            if (result.type === 'STATUS') {
              setCurrentAgent(result.agent);
              setCurrentStep(result.current_step);
              if (result.current_step === 'PLANNING') setPhase('PLANNING');
            } else if (result.type === 'CLARIFY') {
              setPhase('CLARIFYING');
              setMessages(prev => [...prev, {
                agent: 'Planner',
                role: 'Analyst',
                message: `Preciso de algumas clarificações:\n${result.questions.map((q: string) => `- ${q}`).join('\n')}`
              }]);
            } else if (result.type === 'PLAN_GENERATED') {
              setPhase('REVIEWING');
              setPlan(result.payload);
              setMessages(prev => [...prev, {
                agent: 'Planner',
                role: 'Analyst',
                message: 'Plano técnico gerado. Por favor, revise no painel central.'
              }]);
            } else if (result.type === 'CHAT_RESPONSE') {
              setMessages(prev => [...prev, { agent: 'Supervisor', role: 'Assistant', message: result.text }]);
            }
          } else if (data.error) {
            setMessages(prev => [...prev, { agent: 'System', role: 'Error', message: data.error.message }]);
            addLog('error', data.error.message);
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { agent: 'System', role: 'Error', message: error.message || 'Falha ao processar requisição.' }]);
      addLog('error', error.message || 'Falha ao processar requisição.');
    } finally {
      setIsLoading(false);
      setCurrentAgent(undefined);
      setCurrentStep(undefined);
    }
  };

  const handleApprovePlan = async () => {
    if (!plan || isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-key': apiKey } : {})
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'approvePlan',
          params: {
            planId: plan.version,
            planMarkdown: plan.markdown
          },
          id: Date.now(),
          modelId
        })
      });

      const data = await response.json();
      if (data.result?.status === 'APPROVED') {
        setPhase('APPROVED');
        setTaskId(data.result.taskId);
        setMessages(prev => [...prev, { agent: 'Supervisor', role: 'System', message: 'Plano aprovado. Sandbox provisionado.' }]);
      }
    } catch (error) {
      console.error('Error approving plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteCoding = async () => {
    if (!plan || !taskId || isLoading) return;
    setPhase('CODING');
    setIsLoading(true);

    try {
      let allPassed = true;
      const modifiedFiles: string[] = [];

      for (let i = 0; i < plan.tasks.length; i++) {
        setCurrentTaskIndex(i);
        const task = plan.tasks[i];
        setMessages(prev => [...prev, { agent: 'Coder', role: 'Developer', message: `Iniciando tarefa ${task.id}: ${task.title}` }]);

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'x-gemini-key': apiKey } : {})
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'executeTask',
            params: { taskId, plan, taskIndex: i },
            id: Date.now(),
            modelId
          })
        });

        if (!response.body) throw new Error('No response body');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const data = JSON.parse(line);

            if (data.result) {
              const result = data.result;
              if (result.type === 'STATUS') {
                setCurrentAgent(result.agent);
                setCurrentStep(result.current_step);
              } else if (result.verdict) {
                const { coderResult, review, verdict } = result;
                setExecutionResults(prev => [...prev, result]);

                if (verdict.status === 'PASS') {
                  modifiedFiles.push(...verdict.filesModified);
                }

                setMessages(prev => [...prev,
                { agent: 'Coder', role: 'Developer', message: coderResult },
                { agent: 'Critic', role: 'Reviewer', message: `Revisão: ${review.status} (${review.severity})\n${review.comments.join('\n')}` },
                { agent: 'Judge', role: 'Justice', message: `Veredito: ${verdict.status}\n${verdict.summary}` }
                ]);

                if (verdict.status === 'FAIL') {
                  setMessages(prev => [...prev, { agent: 'System', role: 'Error', message: 'Falha no veredito. Interrompendo ciclo.' }]);
                  allPassed = false;
                }
              }
            } else if (data.error) {
              setMessages(prev => [...prev, { agent: 'System', role: 'Error', message: data.error.message }]);
              addLog('error', data.error.message);
              allPassed = false;
            }
          }
        }
        if (!allPassed) break;
      }

      if (allPassed) {
        setPhase('VERIFYING');
        setMessages(prev => [...prev, { agent: 'Supervisor', role: 'System', message: 'Todas as tarefas concluídas. Finalizando sessão...' }]);

        // Finalize
        const finalizeResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'x-gemini-key': apiKey } : {})
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'finalizeTask',
            params: { taskId, status: 'SUCCESS', filesModified: Array.from(new Set(modifiedFiles)) },
            id: Date.now(),
            modelId
          })
        });
        const finalizeData = await finalizeResponse.json();
        if (finalizeData.result) {
          setPostMortem(finalizeData.result);
        }
      }
    } catch (error) {
      console.error('Error executing coding:', error);
    } finally {
      setIsLoading(false);
      setCurrentTaskIndex(-1);
      setCurrentAgent(undefined);
      setCurrentStep(undefined);
    }
  };

  const handleFileClick = async (filePath: string) => {
    if (!taskId) return;
    setIsFetchingFile(true);
    setActiveView('FILE');

    try {
      // We'll use a new endpoint or update the existing one to read files
      // For now, let's assume we can expose a "readFile" method in the chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-key': apiKey } : {})
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'readFile',
          params: { taskId, path: filePath },
          id: Date.now(),
          modelId
        })
      });

      const data = await response.json();
      if (data.result?.content) {
        setSelectedFile({ path: filePath, content: data.result.content });
      }
    } catch (error) {
      console.error('Error fetching file:', error);
    } finally {
      setIsFetchingFile(false);
    }
  };

  const handleReset = () => {
    setPhase('IDLE');
    setMessages([{ agent: 'Supervisor', role: 'System', message: 'Iniciando nova sessão. Qual é o requisito técnico?' }]);
    setPlan(null);
    setTaskId(null);
    setSandboxLogs([]);
    setExecutionResults([]);
    setPostMortem(null);
  };

  if (postMortem) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <CompletionView report={postMortem} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-300 font-sans overflow-hidden">
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
              <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Configurações do Sistema
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Gemini API Key (Opcional)</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Se deixado em branco, o sistema usará o Segredo configurado no ambiente.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleValidateKey}
                  disabled={systemStatus === 'VALIDATING'}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {systemStatus === 'VALIDATING' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  Validar e Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header / Engineering Stepper */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-emerald-500" />
          <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Verdent AI <span className="text-zinc-500 font-normal text-sm ml-2">Tribunal de Ideias</span></h1>
        </div>

        <div className="flex items-center gap-2 text-sm font-medium">
          <StepIndicator current={phase} step="CLARIFYING" label="Clarification" />
          <StepDivider />
          <StepIndicator current={phase} step="PLANNING" label="Planning" />
          <StepDivider />
          <StepIndicator current={phase} step="CODING" label="Coding" />
          <StepDivider />
          <StepIndicator current={phase} step="VERIFYING" label="Verifying" />
        </div>

        <div className="flex items-center gap-4 text-xs">
          <select
            value={modelId}
            onChange={handleModelChange}
            className="bg-zinc-800/50 border border-zinc-700/50 rounded-md px-2 py-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          >
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full ${systemStatus === 'READY' ? 'bg-emerald-500' :
              systemStatus === 'ERROR' ? 'bg-red-500' :
                systemStatus === 'VALIDATING' ? 'bg-amber-500 animate-pulse' :
                  'bg-zinc-500'
              }`} />
            <span>Configurações</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{isLoading ? 'Processando...' : 'Autônomo'}</span>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Panels */}
      <main className="flex-1 grid grid-cols-12 gap-px bg-zinc-800 overflow-hidden">

        {/* Left Panel: Tribunal Chat */}
        <section className="col-span-3 bg-zinc-950 flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-2 bg-zinc-900/20">
            <MessageSquare className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider">Tribunal</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <ChatMessage key={i} agent={msg.agent} role={msg.role} message={msg.message} />
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/20">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Digite seu comando..."
                disabled={isLoading}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-500 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Center Panel: Code/Plan Editor */}
        <section className="col-span-6 bg-[#0d0d0d] flex flex-col relative border-x border-zinc-800/50 h-full overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/40 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveView('PLAN')}
                className={`text-sm font-medium uppercase tracking-wider transition-all flex items-center gap-2 ${activeView === 'PLAN' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Code2 className="w-4 h-4" /> Plano Técnico
              </button>
              {selectedFile && (
                <button
                  onClick={() => setActiveView('FILE')}
                  className={`text-sm font-medium uppercase tracking-wider transition-all flex items-center gap-2 ${activeView === 'FILE' ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Terminal className="w-4 h-4" /> {selectedFile.path.split('/').pop()}
                </button>
              )}
            </div>
            {phase === 'REVIEWING' && activeView === 'PLAN' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setPhase('CLARIFYING')}
                  className="px-3 py-1 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors"
                >
                  Revisar
                </button>
                <button
                  onClick={handleApprovePlan}
                  className="px-3 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors flex items-center gap-1 shadow-lg shadow-emerald-500/20"
                >
                  <Play className="w-3 h-3" /> Aprovar Plano
                </button>
              </div>
            )}
            {phase === 'APPROVED' && activeView === 'PLAN' && (
              <button
                onClick={handleExecuteCoding}
                className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors flex items-center gap-1 shadow-lg shadow-blue-500/20"
              >
                <Play className="w-3 h-3" /> Iniciar Codificação
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeView === 'PLAN' ? (
              <div className="p-8">
                {plan ? (
                  <div className="space-y-12">
                    <div className="prose prose-invert max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-400 prose-strong:text-emerald-400">
                      <ReactMarkdown>
                        {plan.markdown}
                      </ReactMarkdown>
                    </div>

                    {/* Task Progress List */}
                    <div className="border-t border-zinc-800 pt-8">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Progresso das Tarefas
                      </h3>
                      <div className="space-y-3">
                        {plan.tasks.map((task, idx) => {
                          const result = executionResults[idx];
                          const isCurrent = currentTaskIndex === idx;
                          return (
                            <div key={task.id} className={`p-4 rounded-lg border group transition-all duration-300 ${isCurrent ? 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5' : 'border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <span className="text-xs font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors">#{task.id}</span>
                                  <span className={`text-sm font-medium ${isCurrent ? 'text-emerald-400' : 'text-zinc-300'}`}>{task.title}</span>
                                </div>
                                {result ? (
                                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${result.verdict.status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {result.verdict.status === 'PASS' ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    {result.verdict.status}
                                  </div>
                                ) : isCurrent ? (
                                  <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Processando...
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-zinc-800" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-zinc-700 space-y-6">
                    <div className="p-6 rounded-full bg-zinc-900/50 border border-zinc-800">
                      <Code2 className="w-16 h-16 opacity-20" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-zinc-400 font-medium">Aguardando Inteligência Agêntica</h3>
                      <p className="text-xs italic max-w-xs mt-2">O plano técnico aparecerá aqui assim que o Supervisor aprovar a análise inicial.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col bg-[#080808]">
                {selectedFile ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 py-2 bg-zinc-900/20 border-b border-zinc-800/50 flex items-center justify-between">
                      <span className="text-xs font-mono text-zinc-500">{selectedFile.path}</span>
                      {isFetchingFile && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
                    </div>
                    <pre className="flex-1 p-6 font-mono text-sm overflow-y-auto custom-scrollbar leading-relaxed">
                      <code className="text-emerald-500/90">{selectedFile.content}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-600">
                    <p className="text-sm italic">Selecione um arquivo para visualizar o conteúdo.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: Architecture & Logs */}
        <section className="col-span-3 bg-zinc-950 flex flex-col h-full overflow-hidden">
          <div className="h-1/2 flex flex-col overflow-hidden min-h-0">
            <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-2 bg-zinc-900/40 sticky top-0 z-10 backdrop-blur-md">
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
              </div>
              <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider">Arquitetura / Arquivos</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-zinc-900/10 custom-scrollbar">
              {plan ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-3">Arquivos do Projeto:</p>
                  <div className="grid gap-1.5">
                    {plan.affectedFiles.map((file, i) => (
                      <button
                        key={i}
                        onClick={() => handleFileClick(file)}
                        className={`flex items-center gap-3 text-xs p-2.5 rounded-md border transition-all text-left group ${selectedFile?.path === file ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-transparent bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'}`}
                      >
                        <Code2 className={`w-3.5 h-3.5 transition-colors ${selectedFile?.path === file ? 'text-emerald-500' : 'text-zinc-600 group-hover:text-emerald-500/70'}`} />
                        <span className="truncate font-mono">{file}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3 grayscale">
                  <Shield className="w-8 h-8 text-zinc-700" />
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-tighter text-center">
                    Estrutura Bloqueada
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="h-1/2 flex flex-col border-t border-zinc-800 overflow-hidden min-h-0">
            <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-2 bg-zinc-900/40 sticky top-0 z-10 backdrop-blur-md">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-medium text-zinc-200 uppercase tracking-wider">Terminal / Logs</h2>
            </div>
            <div className="flex-1 p-5 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#050505] custom-scrollbar">
              <div className="space-y-1.5">
                <p className="text-zinc-600 font-black">➜ verdent:~ $ initial_boot_sequence --active</p>
                <p className="text-zinc-700">➜ process: warming_up_engines...</p>
                {systemLogs.map((log) => (
                  <p key={log.id} className={`${log.type === 'error' ? 'text-red-400 bg-red-400/5 px-1' : log.type === 'warning' ? 'text-amber-400 bg-amber-400/5 px-1' : 'text-blue-400'} transition-all`}>
                    <span className="opacity-40 tracking-tighter">[{isMounted ? new Date(log.timestamp).toLocaleTimeString() : '--:--:--'}]</span> {log.message}
                  </p>
                ))}
                {phase !== 'IDLE' && (
                  <p className="text-emerald-500/80 font-bold border-l-2 border-emerald-500/20 pl-2 my-2">
                    ➜ status_update: Phase switched to {phase}
                  </p>
                )}
                {isLoading && (
                  <p className="text-amber-500/80 animate-pulse flex items-center gap-2">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> agent_is_working...
                  </p>
                )}
                {sandboxLogs.map((log, i) => (
                  <p key={i} className={`flex gap-2 ${log.action === 'CREATE' ? 'text-emerald-400/70' : log.action === 'UPDATE' ? 'text-blue-400/70' : 'text-zinc-500'}`}>
                    <span className="opacity-30 tracking-tighter">[{isMounted ? new Date(log.timestamp).toLocaleTimeString() : '--:--:--'}]</span>
                    <span className="font-bold opacity-70">[{log.agent}]</span>
                    <span className="opacity-90">{log.action}</span>
                    <span className="italic opacity-60 truncate">{log.path}</span>
                  </p>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </section>

      </main>

      <LoadingIndicator
        isLoading={isLoading}
        agent={currentAgent}
        step={currentStep}
      />
    </div>
  );
}

function StepIndicator({ current, step, label }: { current: PlanState, step: string, label: string }) {
  const steps = ['CLARIFYING', 'PLANNING', 'REVIEWING', 'APPROVED', 'CODING', 'VERIFYING'];
  const currentIndex = steps.indexOf(current === 'IDLE' ? 'CLARIFYING' : current);
  const stepIndex = steps.indexOf(step);

  const isActive = current === step || (current === 'PLANNING' && step === 'PLANNING');
  const isPast = stepIndex < currentIndex;

  return (
    <div className={`flex items-center gap-1.5 ${isActive ? 'text-emerald-400' : isPast ? 'text-zinc-400' : 'text-zinc-600'}`}>
      {isPast ? <CheckCircle className="w-4 h-4" /> : isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
      <span className={isActive ? 'font-semibold' : ''}>{label}</span>
    </div>
  );
}

function StepDivider() {
  return <div className="w-4 h-px bg-zinc-700" />;
}

function ChatMessage({ agent, role, message }: { agent: string, role: string, message: string }) {
  const colors: Record<string, string> = {
    'Supervisor': 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
    'User': 'text-zinc-300 border-zinc-700 bg-zinc-800/30',
    'Planner': 'text-blue-400 border-blue-400/20 bg-blue-400/5',
    'Coder': 'text-amber-400 border-amber-400/20 bg-amber-400/5',
    'Verifier': 'text-purple-400 border-purple-400/20 bg-purple-400/5',
    'Judge': 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5',
    'System': 'text-red-400 border-red-400/20 bg-red-400/5',
  };

  const colorClass = colors[agent] || colors['User'];
  const isAi = agent !== 'User' && agent !== 'System';

  return (
    <div className={`p-3 rounded-lg border ${colorClass} transition-all hover:shadow-md group`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-wider">{agent}</span>
        <span className="text-[10px] opacity-60 uppercase">{role}</span>
      </div>
      <div className="text-sm leading-relaxed prose prose-invert prose-xs max-w-none">
        <ReactMarkdown>
          {message}
        </ReactMarkdown>
      </div>
    </div>
  );
}

import { validateJsonRpcRequest } from '@/lib/utils';
import { PlannerAgent } from '@/agents/planner';
import { CoderAgent } from '@/agents/coder';
import { CriticAgent } from '@/agents/critic';
import { JudgeAgent } from '@/agents/judge';
import { SandboxManager } from '@/lib/sandbox/manager';
import { Committer } from '@/lib/sandbox/committer';
import { TelemetryTracker } from '@/lib/telemetry/tracker';
import { PostMortemReporter } from '@/lib/reports/post-mortem';
import { NextRequest, NextResponse } from 'next/server';
import { LLMProvider } from '@/lib/llm-provider';
import { streamText } from 'ai';

const encoder = new TextEncoder();

export async function POST(req: NextRequest) {
  try {
    const customApiKey = req.headers.get('x-gemini-key') || undefined;

    const body = await req.json();
    const modelId = body.modelId || process.env.DEFAULT_MODEL || 'gemini-1.5-flash';

    if (body.action === 'listModels') {
      const discoveredOllama = await LLMProvider.listLocalModels();
      const models = [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', isLocal: false },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', isLocal: false },
        ...discoveredOllama.map(name => ({
          id: `ollama-${name}`,
          name: `${name} (Local)`,
          provider: 'ollama',
          isLocal: true
        }))
      ];
      return NextResponse.json({ models }, { status: 200 });
    }

    const connectionCheck = await LLMProvider.validateConnection(modelId, customApiKey);
    if (!connectionCheck.success) {
      const errorStatus = body.action === 'validate' ? 401 : 200; // Returns 200 with JSONRpc error if not just validating
      
      if (body.action === 'validate') {
        return NextResponse.json({ error: connectionCheck.message }, { status: 401 });
      }

      return NextResponse.json({
        jsonrpc: '2.0',
        error: { code: -32000, message: connectionCheck.message },
        id: body.id || null
      });
    }

    if (body.action === 'validate') {
      return NextResponse.json({ status: 'OK' }, { status: 200 });
    }

    const tracker = TelemetryTracker.getInstance();

    const validation = validateJsonRpcRequest(body);
    if (!validation.success) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id: null
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { method, params, id } = validation.data;

    if (method === 'sendMessage' || method === 'executeTask') {
      const stream = new ReadableStream({
        async start(controller) {
          const send = (data: any) => {
            controller.enqueue(encoder.encode(JSON.stringify({ jsonrpc: '2.0', id, ...data }) + '\n'));
          };

          try {
            if (method === 'sendMessage') {
              const message = params?.message || '';
              const state = params?.state || 'IDLE';
              const taskId = params?.taskId || 'global';

              if (state === 'IDLE' || state === 'CLARIFYING') {
                send({ result: { type: 'STATUS', is_processing: true, current_step: 'PLANNING', agent: 'Planner' } });

                tracker.startTimer(taskId, 'Planner');
                const planner = new PlannerAgent();
                const result = await planner.analyze(message, modelId, customApiKey);
                tracker.stopTimer(taskId, 'Planner', { prompt: 500, completion: 200 });

                send({ result });
              } else {
                send({ result: { type: 'STATUS', is_processing: true, current_step: 'CHATTING', agent: 'Supervisor' } });
                
                const model = LLMProvider.getModel(modelId, customApiKey);
                const contextContent = await LLMProvider.loadContextFiles();
                const systemInstruction = `You are acting as the role: ${params?.role || 'Supervisor'}. Adhere strictly to the AGENTS.md rules.\n\nContext:\n${contextContent}`;

                const { text } = await streamText({
                  model: model as any,
                  system: systemInstruction,
                  prompt: message,
                });
                
                send({ result: { type: 'CHAT_RESPONSE', text } });
              }
            } else if (method === 'executeTask') {
              const { taskId, plan, taskIndex } = params;
              if (!taskId || !plan || taskIndex === undefined) {
                throw new Error('Missing params');
              }

              const coder = new CoderAgent();
              const critic = new CriticAgent();
              const judge = new JudgeAgent();

              // 1. Coder implements
              send({ result: { type: 'STATUS', is_processing: true, current_step: 'CODING', agent: 'Coder' } });
              tracker.startTimer(taskId, 'Coder');
              const coderResult = await coder.executeTask(taskId, plan, taskIndex, modelId, customApiKey);
              tracker.stopTimer(taskId, 'Coder', { prompt: 1000, completion: 800 });

              // 2. Critic reviews
              send({ result: { type: 'STATUS', is_processing: true, current_step: 'REVIEWING', agent: 'Critic' } });
              tracker.startTimer(taskId, 'Critic');
              const review = await critic.review(taskId, modelId, customApiKey);
              tracker.stopTimer(taskId, 'Critic', { prompt: 1200, completion: 300 });

              // 3. Judge evaluates
              send({ result: { type: 'STATUS', is_processing: true, current_step: 'JUDGING', agent: 'Judge' } });
              tracker.startTimer(taskId, 'Judge');
              const verdict = await judge.evaluate(taskId, [review], modelId, customApiKey);
              tracker.stopTimer(taskId, 'Judge', { prompt: 1500, completion: 200 });

              // 4. If PASS, commit
              let commitResult = null;
              if (verdict.status === 'PASS') {
                send({ result: { type: 'STATUS', is_processing: true, current_step: 'COMMITTING', agent: 'System' } });
                commitResult = await Committer.merge(taskId);
              }

              send({ result: { verdict, coderResult, review, commitResult } });
            }
          } catch (error: any) {
            console.error('Stream Error:', error);
            const errorMessage = error.message?.includes('API key not valid')
              ? 'ERRO: Chave de API do Gemini inválida ou não configurada.'
              : error.message || 'Erro desconhecido no processamento agêntico.';

            send({ error: { code: -32000, message: errorMessage } });
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: { 'Content-Type': 'application/x-ndjson' }
      });
    }

    if (method === 'approvePlan') {
      const taskId = params?.taskId || `task-${Date.now()}`;
      const fs = SandboxManager.create(taskId);
      fs.writeFile(`${fs.context.rootPath}/plan.md`, params?.planMarkdown || '# Plan Approved', 'System');

      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        result: {
          status: 'APPROVED',
          nextPhase: 'CODE',
          taskId,
          rootPath: fs.context.rootPath
        },
        id
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'finalizeTask') {
      const { taskId, status, filesModified } = params;
      if (!taskId) return new Response('Missing taskId', { status: 400 });

      const report = PostMortemReporter.generate(taskId, status || 'SUCCESS', filesModified || []);

      // Cleanup
      SandboxManager.purge(taskId);
      tracker.clear(taskId);

      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        result: report,
        id
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (method === 'readFile') {
      const { taskId, path } = params;
      if (!taskId || !path) return new Response('Missing params', { status: 400 });

      const fs = SandboxManager.get(taskId);
      if (!fs) return new Response('Sandbox not found', { status: 404 });

      const content = fs.readFile(path);
      return new Response(JSON.stringify({ jsonrpc: '2.0', result: { content }, id }));
    }

    if (method === 'getLogs') {
      const taskId = params?.taskId;
      if (!taskId) return new Response('Missing taskId', { status: 400 });

      const logs = SandboxManager.getAllLogs(taskId);
      return new Response(JSON.stringify({ jsonrpc: '2.0', result: logs, id }));
    }

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32601, message: 'Method not found' },
      id
    }), { status: 404, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    const errorMessage = error.message?.includes('API key not valid')
      ? 'ERRO: Chave de API do Gemini inválida ou não configurada.'
      : error.message || 'Erro interno no servidor.';

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message: errorMessage },
      id: null
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

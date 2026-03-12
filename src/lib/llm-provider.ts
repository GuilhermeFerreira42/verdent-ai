import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOllama } from 'ai-sdk-ollama';
import { generateText } from 'ai';
import { promises as fs } from 'fs';
import path from 'path';

export class LLMProvider {
  static getModel(modelId: string, customApiKey?: string) {
    if (modelId.startsWith('gemini-')) {
      const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
        throw new Error('ERRO: Chave de API do Gemini não configurada.');
      }
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId);
    }
    
    if (modelId.startsWith('ollama-')) {
      const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const sanitizedModelId = modelId.replace('ollama-', '');
      
      console.log(JSON.stringify({
        level: 'info',
        agent: 'System',
        action: 'GET_MODEL',
        provider: 'ollama',
        env: { OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL },
        sanitized: { baseURL, modelId: sanitizedModelId },
        timestamp: Date.now()
      }));

      const ollama = createOllama({ baseURL });
      return ollama(sanitizedModelId);
    }
    
    throw new Error(`Provedor não suportado para o modelo: ${modelId}`);
  }

  static async listLocalModels(): Promise<string[]> {
    try {
      const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const response = await fetch(`${baseURL}/api/tags`);
      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.models || []).map((m: any) => m.name);
    } catch (error) {
      console.warn('Ollama not reachable for model discovery');
      return [];
    }
  }

  static async validateConnection(modelId: string, customApiKey?: string): Promise<{ success: boolean; message?: string }> {
    const timestamp = Date.now();
    try {
      console.log(JSON.stringify({
        level: 'info',
        agent: 'Verifier',
        action: 'VALIDATE_HANDSHAKE_START',
        modelId,
        timestamp
      }));

      const model = this.getModel(modelId, customApiKey);
      
      const { text } = await generateText({
        model: model as any,
        prompt: 'Hello',
      });

      console.log(JSON.stringify({
        level: 'info',
        agent: 'Verifier',
        action: 'VALIDATE_HANDSHAKE_SUCCESS',
        modelId,
        responseSnippet: text.substring(0, 50),
        timestamp: Date.now()
      }));

      return { success: true };
    } catch (error: any) {
      const errorTimestamp = Date.now();
      const status = error.status || error.status_code || (error.cause && (error.cause.status || error.cause.status_code));
      
      let diagnostic = 'Erro desconhecido ao validar a conexão.';
      let type = 'UNKNOWN_ERROR';

      if (modelId.startsWith('gemini-') && error.message?.includes('API key not valid')) {
        diagnostic = 'ERRO: Chave de API do Gemini inválida.';
        type = 'INVALID_API_KEY';
      } else if (modelId.startsWith('ollama-')) {
        if (error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED')) {
          diagnostic = 'ERRO: Servidor Ollama não detectado. Certifique-se de que está rodando em localhost:11434.';
          type = 'HOST_UNREACHABLE';
        } else if (status === 404) {
          diagnostic = 'ERRO 404: Endpoint não encontrado ou Modelo inexistente no host Ollama.';
          type = 'NOT_FOUND_404';
        }
      }

      console.error(JSON.stringify({
        level: 'error',
        agent: 'Verifier',
        action: 'VALIDATE_HANDSHAKE_FAILURE',
        modelId,
        error: {
          message: error.message,
          status: status,
          stack: error.stack,
          cause: error.cause
        },
        diagnostic,
        type,
        timestamp: errorTimestamp
      }));

      return { success: false, message: diagnostic };
    }
  }

  static async loadContextFiles(): Promise<string> {
    try {
      const agentsPath = path.join(process.cwd(), 'AGENTS.md');
      const prdPath = path.join(process.cwd(), 'PRD_TRIBUNAL_-_NEXT_JS.md');

      const agentsContent = await fs.readFile(agentsPath, 'utf-8').catch(() => '');
      const prdContent = await fs.readFile(prdPath, 'utf-8').catch(() => '');

      return `AGENTS.md (Governança):\n${agentsContent}\n\nPRD (Requisitos):\n${prdContent}`;
    } catch (error) {
      console.error('Error loading context files:', error);
      return '';
    }
  }
}

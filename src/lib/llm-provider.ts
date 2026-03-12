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
      const baseURL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434') + '/api';
      const ollama = createOllama({ baseURL });
      return ollama(modelId.replace('ollama-', ''));
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
    try {
      const model = this.getModel(modelId, customApiKey);
      
      const { text } = await generateText({
        model: model as any,
        prompt: 'Hello',
      });

      return { success: true };
    } catch (error: any) {
      console.error('DIAGNÓSTICO: Conexão inválida.', error);
      let errorMessage = error.message || 'Erro desconhecido ao validar a conexão.';
      
      if (modelId.startsWith('gemini-') && errorMessage.includes('API key not valid')) {
        errorMessage = 'ERRO: Chave de API do Gemini inválida.';
      } else if (modelId.startsWith('ollama-') && (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED'))) {
        errorMessage = 'ERRO: Servidor Ollama não detectado. Certifique-se de que está rodando localmente.';
      }

      return { success: false, message: errorMessage };
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

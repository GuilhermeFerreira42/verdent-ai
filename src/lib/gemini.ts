import { GoogleGenAI } from '@google/genai';
import { promises as fs } from 'fs';
import path from 'path';

// Singleton instance
let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    throw new Error('ERRO: Chave de API do Gemini não configurada nos Segredos do Sistema nem fornecida pelo utilizador.');
  }

  if (customApiKey) {
    return new GoogleGenAI({ apiKey: customApiKey });
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

// Cache management
let activeCacheName: string | null = null;
let cacheFingerprint: string | null = null;

async function loadContextFiles(): Promise<string> {
  try {
    const agentsPath = path.join(process.cwd(), 'AGENTS.md');
    const prdPath = path.join(process.cwd(), 'PRD_TRIBUNAL_-_NEXT_JS.md');

    const agentsContent = await fs.readFile(agentsPath, 'utf-8').catch(() => '');
    const prdContent = await fs.readFile(prdPath, 'utf-8').catch(() => '');

    return `AGENTS.md:\n${agentsContent}\n\nPRD:\n${prdContent}`;
  } catch (error) {
    console.error('Error loading context files:', error);
    return '';
  }
}

export async function validateConnection(customApiKey?: string): Promise<{ success: boolean; message?: string }> {
  try {
    const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      console.error('DIAGNÓSTICO: Configure o segredo GEMINI_API_KEY no painel de Secrets ou insira na interface.');
      return { success: false, message: 'ERRO: Chave de API do Gemini não configurada.' };
    }

    const ai = getGeminiClient(customApiKey);
    await ai.models.list();

    return { success: true };
  } catch (error: any) {
    console.error('DIAGNÓSTICO: Chave inválida.');
    const errorMessage = error.message?.includes('API key not valid')
      ? 'ERRO: Chave de API do Gemini inválida.'
      : error.message || 'Erro desconhecido ao validar a chave.';
    return { success: false, message: errorMessage };
  }
}

const MODEL_NAME = 'gemini-2.5-flash';

export async function getAgentSession(role: string, customApiKey?: string) {
  const ai = getGeminiClient(customApiKey);
  const contextContent = await loadContextFiles();

  // Create a simple hash for fingerprinting
  const currentFingerprint = Buffer.from(contextContent).toString('base64').substring(0, 32);

  // In a real implementation with ai.caches.create, we would cache the context.
  // For now, we'll use systemInstruction directly to ensure stability.
  const systemInstruction = `You are acting as the role: ${role}. Adhere strictly to the AGENTS.md rules.\n\nContext:\n${contextContent}`;

  const chatConfig: any = {
    systemInstruction,
    temperature: 0,
  };

  const chat = ai.chats.create({
    model: MODEL_NAME,
    config: chatConfig,
  });

  return chat;
}

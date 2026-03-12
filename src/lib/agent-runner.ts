import { generateText } from 'ai';
import { LLMProvider } from '@/lib/llm-provider';

export async function executeAgent(
  modelId: string,
  role: string,
  prompt: string,
  customApiKey?: string
): Promise<string> {
  const model = LLMProvider.getModel(modelId, customApiKey);
  const contextContent = await LLMProvider.loadContextFiles();
  
  const systemInstruction = `You are acting as the role: ${role}. Adhere strictly to the AGENTS.md rules.\n\nContext:\n${contextContent}`;

  const { text } = await generateText({
    model: model as any,
    system: systemInstruction,
    prompt,
    temperature: 0,
  });

  return text;
}

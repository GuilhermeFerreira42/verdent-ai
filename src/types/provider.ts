export type LLMProviderType = 'google' | 'ollama';

export interface LLMModelDefinition {
  id: string;              // Ex: 'gemini-1.5-pro' ou 'llama3.1'
  provider: LLMProviderType;
  name: string;            // Nome amigável para exibição na UI
  contextWindow: number;   // Limite de tokens
  isLocal: boolean;
}

export interface LLMDriverConfig {
  apiKey?: string;         // Obrigatório para Google
  baseUrl?: string;        // Obrigatório para Ollama (default: http://localhost:11434)
  temperature: number;     // Padrão: 0.0 para determinismo
  maxTokens?: number;
}

export interface ProviderState {
  activeModelId: string;
  isAvailable: boolean;
  latencyMs: number;
}

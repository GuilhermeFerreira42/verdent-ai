import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

// Manual env parsing to avoid external dependencies
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

async function verify() {
  console.log('--- Verificando Conexões (Protocolo 2.0) ---');
  
  // 1. Test Gemini
  const geminiModel = process.env.DEFAULT_MODEL || 'gemini-1.5-flash';
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ action: 'validate', modelId: geminiModel })
    });
    const result = await res.json();
    console.log(`[GEMINI] Status: ${res.status} - ${JSON.stringify(result)}`);
  } catch (e) {
    console.warn(`[GEMINI] Connection Failed: ${e.message}`);
  }

  // 2. Test Ollama (Handshake & Model check)
  const ollamaBase = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const cleanBase = ollamaBase.replace(/\/api\/?$/, '');
  
  try {
    console.log(`[OLLAMA] Testando handshake em: ${cleanBase}/api/tags`);
    const res = await fetch(`${cleanBase}/api/tags`);
    
    if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    const models = (data.models || []).map(m => m.name);
    console.log(`[OLLAMA] Handshake OK. Modelos encontrados: ${JSON.stringify(models)}`);

    if (models.length === 0) {
        console.error('FATAL: Nenhum modelo encontrado no Ollama. Execute "ollama pull <modelo>".');
        process.exit(1);
    }

    // Valida se o modelo configurado (se for Ollama) existe
    if (geminiModel.startsWith('ollama-')) {
        const targetModel = geminiModel.replace('ollama-', '');
        if (!models.includes(targetModel) && !models.includes(`${targetModel}:latest`)) {
            console.error(`FATAL: Modelo configurado "${targetModel}" não encontrado no host local.`);
            process.exit(1);
        }
    }

  } catch (e) {
    console.error(`[OLLAMA] Falha crítica no handshake: ${e.message}`);
    if (geminiModel.startsWith('ollama-')) {
        process.exit(1);
    }
  }
}

verify();

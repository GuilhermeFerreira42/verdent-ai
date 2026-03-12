async function verify() {
  console.log('--- Verificando Conexões ---');
  
  // Test Gemini
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ action: 'validate', modelId: 'gemini-1.5-flash' })
    });
    console.log(`Gemini Status: ${res.status} ${await res.text()}`);
  } catch (e) {
    console.log(`Gemini Connection Failed: ${e.message}`);
  }

  // Test Ollama (Handshake)
  try {
    const res = await fetch('http://localhost:11434/api/tags');
    console.log(`Ollama Status: ${res.status}`);
    const data = await res.json();
    console.log(`Ollama Models: ${JSON.stringify(data.models?.map(m => m.name))}`);
  } catch (e) {
    console.log(`Ollama Connection Failed (Expected if local or not running): ${e.message}`);
  }
}

verify();

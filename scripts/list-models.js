const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error('API Key not found in environment');
        return;
    }
    const genAI = new GoogleGenAI({ apiKey });
    try {
        console.log('Available Models:');
        const models = [];
        const response = await genAI.models.list();
        for await (const m of response) {
            models.push(m.name);
        }
        console.log(JSON.stringify(models, null, 2));
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();

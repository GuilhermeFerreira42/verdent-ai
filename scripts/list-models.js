const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error('API Key not found in environment');
        return;
    }
    const genAI = new GoogleGenAI(apiKey);
    try {
        const result = await genAI.listModels();
        console.log('Available Models:');
        console.log(JSON.stringify(result.models.map(m => m.name), null, 2));
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('API Key not found in .env');
        return;
    }
    const genAI = new GoogleGenAI(apiKey);
    try {
        const result = await genAI.listModels();
        console.log('Available Models:');
        result.models.forEach(m => {
            console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
        });
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();

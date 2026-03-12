import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('API Key not found in .env');
        return;
    }
    const genAI = new GoogleGenAI({ apiKey });
    try {
        console.log('Available Models:');
        const response = await genAI.models.list();
        for await (const m of response) {
            console.log(`- ${m.name}`);
        }
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();

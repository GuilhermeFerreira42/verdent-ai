import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenAI(apiKey);

    try {
        const result = await genAI.listModels();
        const models = result.models.map(m => ({
            name: m.name,
            description: m.description,
            methods: m.supportedGenerationMethods
        }));

        return NextResponse.json({ models });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

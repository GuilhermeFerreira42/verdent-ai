import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export async function GET() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenAI({ apiKey });

    try {
        const models = [];
        const response = await genAI.models.list();
        for await (const m of response) {
            models.push({
                name: m.name,
                description: m.description
            });
        }

        return NextResponse.json({ models });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

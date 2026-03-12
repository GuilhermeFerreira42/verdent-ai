import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const model = google('gemini-2.5-flash');

async function main() {
  const { text } = await generateText({
    model,
    prompt: 'Hello',
  });
  console.log(text);
}
main();

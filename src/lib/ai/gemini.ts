const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

export type GeminiMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export async function streamGemini(messages: GeminiMessage[]) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: 'You are NexoraAI, a helpful AI assistant inside NexoraTools. Be concise, accurate, and practical. When the user asks for website or UI code, provide complete runnable HTML/CSS/JavaScript in fenced code blocks and briefly explain the result. Never expose secrets or internal configuration.',
          }],
        },
        contents: messages,
      }),
    },
  );

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => 'Unknown Gemini error');
    throw new Error(`Gemini request failed (${response.status}): ${detail}`);
  }

  return response.body;
}

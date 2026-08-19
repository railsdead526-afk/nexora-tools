import type { AIChatInput, AIProvider, AIStreamChunk } from '../types';

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const DEFAULT_SYSTEM = 'You are NexoraAI, a helpful AI assistant inside NexoraTools. Be concise, accurate, practical, and safe. When asked to build a website or UI, provide complete runnable HTML/CSS/JavaScript in fenced code blocks so NexoraAI can preview it. Never reveal secrets or internal configuration.';

type GeminiPart = { text: string };
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

export class GeminiAIProvider implements AIProvider {
  readonly name = 'gemini';

  async *chat(input: AIChatInput): AsyncGenerator<AIStreamChunk> {
    if (!API_KEY) {
      yield { type: 'error', error: 'GEMINI_API_KEY is not configured.' };
      return;
    }

    const model = input.model || DEFAULT_MODEL;
    const systemMessages = input.messages.filter((message) => message.role === 'system').map((message) => message.content.trim()).filter(Boolean);
    const systemInstruction = [DEFAULT_SYSTEM, ...systemMessages].join('\n\n');
    const contents: GeminiContent[] = input.messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }));

    if (!contents.length) {
      yield { type: 'error', error: 'No valid messages supplied.' };
      return;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
      }),
    });

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => 'Unknown Gemini error');
      yield { type: 'error', error: `Gemini request failed (${response.status}): ${detail.slice(0, 500)}` };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const event of events) {
          const line = event.split('\n').find((item) => item.startsWith('data: '));
          if (!line) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload) as { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> };
            const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
            if (text) yield { type: 'text', text };
          } catch {
            // Ignore incomplete SSE frames.
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { type: 'done' };
  }
}

import type { AIChatInput, AIProvider, AIStreamChunk } from '../types';

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const DEFAULT_SYSTEM = 'You are NexoraAI, a helpful AI assistant inside NexoraTools. Be concise, accurate, practical, and safe. When asked to build a website or UI, provide complete runnable HTML/CSS/JavaScript in fenced code blocks so NexoraAI can preview it. Never reveal secrets or internal configuration.';

type GeminiPart = { text?: string };
type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };
type GeminiResponse = { candidates?: Array<{ content?: { parts?: GeminiPart[] } }>; error?: { message?: string } };

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
      .map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] }));

    if (!contents.length) {
      yield { type: 'error', error: 'No valid messages supplied.' };
      return;
    }

    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemInstruction }] }, contents }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network request failed.';
      console.error('Gemini fetch error:', { model, latencyMs: Date.now() - startedAt, message });
      yield { type: 'error', error: `Gemini connection failed: ${message}` };
      return;
    }

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => 'Unknown Gemini error');
      console.error('Gemini HTTP error:', { model, status: response.status, latencyMs: Date.now() - startedAt });
      yield { type: 'error', error: `Gemini request failed (${response.status}): ${detail.slice(0, 500)}` };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let firstTokenAt: number | null = null;

    const parseEvent = (event: string): GeminiResponse | null => {
      const payload = event.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trimStart()).join('');
      if (!payload || payload === '[DONE]') return null;
      try { return JSON.parse(payload) as GeminiResponse; } catch { return null; }
    };

    const emitResponse = async function* (json: GeminiResponse): AsyncGenerator<AIStreamChunk> {
      if (json.error?.message) {
        yield { type: 'error', error: `Gemini stream error: ${json.error.message}` };
        return;
      }
      const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '';
      if (text) {
        if (firstTokenAt === null) {
          firstTokenAt = Date.now();
          console.info('Gemini first token:', { model, ttftMs: firstTokenAt - startedAt });
        }
        yield { type: 'text', text };
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? '';
        for (const event of events) {
          const json = parseEvent(event);
          if (!json) continue;
          for await (const chunk of emitResponse(json)) {
            if (chunk.type === 'error') {
              yield chunk;
              return;
            }
            yield chunk;
          }
        }
      }
      buffer += decoder.decode();
      if (buffer.trim()) {
        const json = parseEvent(buffer);
        if (json) {
          for await (const chunk of emitResponse(json)) {
            if (chunk.type === 'error') { yield chunk; return; }
            yield chunk;
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gemini stream failed.';
      console.error('Gemini stream error:', { model, latencyMs: Date.now() - startedAt, message });
      yield { type: 'error', error: `Gemini stream failed: ${message}` };
      return;
    } finally {
      reader.releaseLock();
    }

    yield { type: 'done' };
  }
}

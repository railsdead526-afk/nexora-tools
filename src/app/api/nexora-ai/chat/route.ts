import { streamGemini, type GeminiMessage } from '@/lib/ai/gemini';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = body?.messages as GeminiMessage[] | undefined;

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'messages is required' }, { status: 400 });
    }

    const safeMessages = messages
      .filter((message) => message?.role === 'user' || message?.role === 'model')
      .map((message) => ({
        role: message.role,
        parts: [{ text: String(message.parts?.[0]?.text ?? '') }],
      }))
      .filter((message) => message.parts[0].text.trim().length > 0);

    if (!safeMessages.length) {
      return Response.json({ error: 'No valid message content' }, { status: 400 });
    }

    const upstream = await streamGemini(safeMessages);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = upstream.getReader();

    const output = new ReadableStream({
      async start(controller) {
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
                const json = JSON.parse(payload);
                const text = json?.candidates?.[0]?.content?.parts
                  ?.map((part: { text?: string }) => part.text || '')
                  .join('') || '';
                if (text) controller.enqueue(encoder.encode(text));
              } catch {
                // Ignore incomplete/non-JSON SSE frames.
              }
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(output, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('NexoraAI chat error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'AI request failed' },
      { status: 500 },
    );
  }
}

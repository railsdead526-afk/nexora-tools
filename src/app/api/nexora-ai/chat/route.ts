import { getAIOrchestrator } from '@/lib/ai/orchestrator';
import type { AIChatInput } from '@/lib/ai/types';

export const runtime = 'nodejs';

type LegacyMessage = {
  role?: 'user' | 'model';
  parts?: Array<{ text?: string }>;
};

function toAIChatInput(messages: LegacyMessage[]): AIChatInput {
  return {
    messages: messages
      .filter((message) => message?.role === 'user' || message?.role === 'model')
      .map((message): { role: 'user' | 'assistant'; content: string } => ({
        role: message.role === 'model' ? 'assistant' : 'user',
        content: String(message.parts?.[0]?.text ?? '').trim(),
      }))
      .filter((message) => message.content.length > 0),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: LegacyMessage[];
      model?: string;
    };

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: 'messages is required' }, { status: 400 });
    }

    const input = toAIChatInput(body.messages);
    if (!input.messages.length) {
      return Response.json({ error: 'No valid message content' }, { status: 400 });
    }

    if (typeof body.model === 'string' && body.model.trim()) {
      input.model = body.model.trim();
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const orchestrator = getAIOrchestrator();
          for await (const chunk of orchestrator.chat(input)) {
            if (chunk.type === 'text' && chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
            if (chunk.type === 'error') {
              controller.enqueue(
                encoder.encode(
                  `\n\nNexoraAI error: ${chunk.error || 'AI request failed.'}`,
                ),
              );
              controller.close();
              return;
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
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

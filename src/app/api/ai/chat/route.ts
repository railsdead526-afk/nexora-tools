import { NextResponse } from 'next/server';
import { getAIOrchestrator } from '@/lib/ai/orchestrator';
import type { AIChatInput } from '@/lib/ai/types';

export const runtime = 'nodejs';

function isValidMessage(value: unknown): value is AIChatInput['messages'][number] {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === 'user' || message.role === 'assistant' || message.role === 'system') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<AIChatInput>;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: 'Messages wajib diisi.' }, { status: 400 });
    }

    if (body.messages.length > 50 || !body.messages.every(isValidMessage)) {
      return NextResponse.json({ error: 'Format messages tidak valid.' }, { status: 400 });
    }

    const input: AIChatInput = {
      messages: body.messages.map((message) => ({
        role: message.role,
        content: message.content.trim(),
      })),
      model: typeof body.model === 'string' ? body.model.trim() : undefined,
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const orchestrator = getAIOrchestrator();

          for await (const chunk of orchestrator.chat(input)) {
            if (chunk.type === 'text' && chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
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
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memproses chat AI.' },
      { status: 500 },
    );
  }
}

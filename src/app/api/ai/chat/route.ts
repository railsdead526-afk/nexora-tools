import { NextResponse } from 'next/server';
import { getAIOrchestrator } from '@/lib/ai/orchestrator';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/auth/require-user';
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
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Silakan masuk untuk menggunakan NexoraAI.' }, { status: 401 });

  try {
    const body = (await request.json()) as { conversationId?: unknown; content?: unknown; model?: unknown };
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!conversationId || !content || content.length > 20000) {
      return NextResponse.json({ error: 'Conversation dan pesan wajib diisi.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: conversation, error: conversationError } = await supabase
      .from('ai_conversations')
      .select('id,title')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();
    if (conversationError || !conversation) return NextResponse.json({ error: 'Conversation tidak ditemukan.' }, { status: 404 });

    const { data: storedMessages, error: messagesError } = await supabase
      .from('ai_messages')
      .select('role,content,created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (messagesError) return NextResponse.json({ error: 'Gagal membaca riwayat chat.' }, { status: 500 });

    const history = (storedMessages ?? []).map((message) => ({ role: message.role as 'user' | 'assistant' | 'system', content: message.content }));
    if (history.length >= 50) return NextResponse.json({ error: 'Percakapan sudah mencapai batas konteks.' }, { status: 400 });

    const { error: userMessageError } = await supabase.from('ai_messages').insert({ conversation_id: conversationId, role: 'user', content });
    if (userMessageError) return NextResponse.json({ error: 'Gagal menyimpan pesan.' }, { status: 500 });

    if (conversation.title === 'Chat baru') {
      await supabase.from('ai_conversations').update({ title: content.replace(/\s+/g, ' ').slice(0, 38) + (content.length > 38 ? '…' : '') }).eq('id', conversationId).eq('user_id', user.id);
    }

    const input: AIChatInput = {
      messages: [...history, { role: 'user', content }].filter(isValidMessage),
      model: typeof body.model === 'string' ? body.model.trim() : undefined,
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let assistantText = '';
        try {
          const orchestrator = getAIOrchestrator();
          for await (const chunk of orchestrator.chat(input)) {
            if (chunk.type === 'text' && chunk.text) {
              assistantText += chunk.text;
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          if (assistantText.trim()) {
            await supabase.from('ai_messages').insert({ conversation_id: conversationId, role: 'assistant', content: assistantText });
          }
          controller.close();
        } catch (error) {
          console.error('AI stream error:', error);
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
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal memproses chat AI.' }, { status: 500 });
  }
}

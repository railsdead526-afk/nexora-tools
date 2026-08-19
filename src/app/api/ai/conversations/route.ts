import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/auth/require-user';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('id,title,created_at,updated_at,ai_messages(id,role,content,created_at)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Gagal mengambil riwayat chat.' }, { status: 500 });
  return NextResponse.json({ conversations: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { title?: unknown };
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 120) : 'Chat baru';
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ user_id: user.id, title })
    .select('id,title,created_at,updated_at')
    .single();

  if (error) return NextResponse.json({ error: 'Gagal membuat chat baru.' }, { status: 500 });
  return NextResponse.json({ conversation: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Conversation ID wajib diisi.' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from('ai_conversations').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Gagal menghapus chat.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ALLOWED_TYPES = new Set(['Bug', 'Saran', 'Pertanyaan']);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = ALLOWED_TYPES.has(body?.type) ? body.type : 'Saran';
    const message = String(body?.message || '').trim();

    if (!message || message.length > 3000) {
      return NextResponse.json({ error: 'Pesan wajib diisi dan maksimal 3000 karakter.' }, { status: 400 });
    }

    const user = await getUserFromRequest(request);
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id || null,
      email: user?.email || null,
      type,
      message,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan laporan.' }, { status: 500 });
  }
}

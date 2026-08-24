import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { consumeRateLimit, rateLimitResponse } from '@/lib/security/rate-limit';

const ALLOWED_TYPES = new Set(['Bug', 'Saran', 'Pertanyaan']);

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Login diperlukan untuk mengirim feedback.' }, { status: 401 });
    }

    const rate = consumeRateLimit(`feedback:${user.id}`, 3, 10 * 60_000);
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSeconds, 'Terlalu banyak feedback. Coba lagi nanti.');
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 64_000) {
      return NextResponse.json({ error: 'Request terlalu besar.' }, { status: 413 });
    }

    const body = await request.json();
    const type = ALLOWED_TYPES.has(body?.type) ? body.type : 'Saran';
    const message = String(body?.message || '').trim();

    if (!message || message.length > 3000) {
      return NextResponse.json({ error: 'Pesan wajib diisi dan maksimal 3000 karakter.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      email: user.email || null,
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

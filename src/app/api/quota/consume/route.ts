import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { consumeToolQuota } from '@/lib/usage/quota';

// Hanya tool yang proses utamanya masih berjalan di browser yang boleh memakai endpoint umum ini.
// Tool server-side (mis. downloader) wajib consume quota di route tool-nya sendiri.
const CLIENT_QUOTA_TOOLS = new Set(['bg_remover']);

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Login diperlukan.' }, { status: 401 });

    const body = await request.json();
    const tool = String(body?.tool || '');

    if (!CLIENT_QUOTA_TOOLS.has(tool)) {
      return NextResponse.json({ error: 'Tool quota tidak valid.' }, { status: 400 });
    }

    const quota = await consumeToolQuota(user.id, 'bg_remover');

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Batas penggunaan hari ini sudah tercapai (${quota.limit}x).`,
          quota,
        },
        { status: 429 },
      );
    }

    return NextResponse.json({ success: true, quota });
  } catch (error) {
    console.error('Quota consume error:', error);
    return NextResponse.json({ error: 'Gagal memproses quota.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ACTIONS = new Set(['get_info', 'download_file']);
const RESOLUTIONS = new Set(['360', '720', '1080', '1440', '2160', 'mp3']);
const PRO_RESOLUTIONS = new Set(['1080', '1440', '2160']);

function isAllowedVideoUrl(input: string) {
  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    return host === 'youtu.be' || host.endsWith('.youtube.com') || host === 'youtube.com' || host.endsWith('.tiktok.com') || host === 'tiktok.com';
  } catch {
    return false;
  }
}

async function hasActivePro(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan,status,expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.expires_at) return false;
  return data.plan === 'pro' && data.status === 'active' && new Date(data.expires_at).getTime() > Date.now();
}

export async function POST(request: Request) {
  try {
    const workerUrl = process.env.DOWNLOADER_WORKER_URL;
    if (!workerUrl) {
      return NextResponse.json({ error: 'Downloader sedang dinonaktifkan sampai worker produksi dikonfigurasi.' }, { status: 503 });
    }

    const body = await request.json();
    const action = String(body?.action || '');
    const url = String(body?.url || '').trim();
    const resolution = String(body?.resolution || '720');
    const isAudio = Boolean(body?.isAudio) || resolution === 'mp3';

    if (!ACTIONS.has(action)) return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 });
    if (!isAllowedVideoUrl(url)) return NextResponse.json({ error: 'URL video tidak didukung.' }, { status: 400 });
    if (!RESOLUTIONS.has(resolution)) return NextResponse.json({ error: 'Resolusi tidak valid.' }, { status: 400 });

    if (action === 'download_file' && PRO_RESOLUTIONS.has(resolution)) {
      const user = await getUserFromRequest(request);
      if (!user || !(await hasActivePro(user.id))) {
        return NextResponse.json({ error: 'Resolusi ini khusus pengguna PRO.' }, { status: 403 });
      }
    }

    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.DOWNLOADER_WORKER_TOKEN ? { Authorization: `Bearer ${process.env.DOWNLOADER_WORKER_TOKEN}` } : {}),
      },
      body: JSON.stringify({ action, url, resolution, isAudio }),
      cache: 'no-store',
      signal: AbortSignal.timeout(60_000),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Downloader proxy error:', error);
    return NextResponse.json({ error: 'Downloader gagal memproses permintaan.' }, { status: 502 });
  }
}

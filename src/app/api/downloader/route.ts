import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { getAccountSubscriptionStatus } from '@/lib/account/subscription';
import { consumeToolQuota, refundToolQuota } from '@/lib/usage/quota';

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

export async function POST(request: Request) {
  let quotaUserId: string | null = null;
  let quotaConsumed = false;

  try {
    const workerUrl = process.env.DOWNLOADER_WORKER_URL;
    if (!workerUrl) {
      return NextResponse.json({ error: 'Downloader sedang dinonaktifkan sampai worker produksi dikonfigurasi.' }, { status: 503 });
    }

    let parsedWorkerUrl: URL;
    try {
      parsedWorkerUrl = new URL(workerUrl);
      if (parsedWorkerUrl.protocol !== 'https:' && parsedWorkerUrl.hostname !== 'localhost') {
        throw new Error('Worker harus menggunakan HTTPS.');
      }
    } catch {
      return NextResponse.json({ error: 'Konfigurasi downloader worker tidak valid.' }, { status: 503 });
    }

    const body = await request.json();
    const action = String(body?.action || '');
    const url = String(body?.url || '').trim();
    const resolution = String(body?.resolution || '720');
    const isAudio = Boolean(body?.isAudio) || resolution === 'mp3';

    if (!ACTIONS.has(action)) return NextResponse.json({ error: 'Aksi tidak valid.' }, { status: 400 });
    if (!isAllowedVideoUrl(url)) return NextResponse.json({ error: 'URL video tidak didukung.' }, { status: 400 });
    if (!RESOLUTIONS.has(resolution)) return NextResponse.json({ error: 'Resolusi tidak valid.' }, { status: 400 });

    // Metadata boleh dicek tanpa mengurangi quota. Download file wajib login dan tercatat server-side.
    if (action === 'download_file') {
      const user = await getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ error: 'Login diperlukan untuk mengunduh file.' }, { status: 401 });
      }

      quotaUserId = user.id;
      const subscription = await getAccountSubscriptionStatus(user.id);

      if (PRO_RESOLUTIONS.has(resolution) && !subscription.isPro) {
        return NextResponse.json({ error: 'Resolusi ini khusus pengguna PRO.' }, { status: 403 });
      }

      const quota = await consumeToolQuota(user.id, 'downloader');
      if (!quota.allowed) {
        return NextResponse.json(
          {
            error: `Batas downloader hari ini sudah tercapai (${quota.limit}x).`,
            quota,
          },
          { status: 429 },
        );
      }

      quotaConsumed = true;
    }

    const response = await fetch(parsedWorkerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.DOWNLOADER_WORKER_TOKEN ? { Authorization: `Bearer ${process.env.DOWNLOADER_WORKER_TOKEN}` } : {}),
      },
      body: JSON.stringify({ action, url, resolution, isAudio }),
      cache: 'no-store',
      signal: AbortSignal.timeout(110_000),
    });

    const data = await response.json().catch(() => ({ error: 'Worker mengembalikan respons yang tidak valid.' }));

    if (quotaConsumed && quotaUserId && (!response.ok || data?.success === false)) {
      await refundToolQuota(quotaUserId, 'downloader');
      quotaConsumed = false;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (quotaConsumed && quotaUserId) {
      await refundToolQuota(quotaUserId, 'downloader');
    }

    console.error('Downloader proxy error:', error);
    return NextResponse.json({ error: 'Downloader gagal memproses permintaan.' }, { status: 502 });
  }
}

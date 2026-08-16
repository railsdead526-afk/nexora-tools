import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { action, url, resolution = '720', isAudio = false } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'Link URL tidak boleh kosong' }, { status: 400 });
    }

    const cleanUrl = url.trim().split('&si=')[0];
    const isTikTok = /tiktok\.com|douyin\.com/i.test(cleanUrl);

    // ================= 1. TIKTOK TURBO ENGINE =================
    if (isTikTok) {
      if (action === 'get_info') {
        try {
          const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });
          const json = await res.json();

          if (json.code === 0 && json.data) {
            return NextResponse.json({
              success: true,
              isTikTok: true,
              title: json.data.title || 'TikTok Video (Tanpa Watermark)',
              thumbnail: json.data.cover || json.data.origin_cover || '',
              duration: `${json.data.duration || 0} Detik`,
              uploader: `@${json.data.author?.unique_id || json.data.author?.nickname || 'creator'}`,
            });
          }
        } catch (e) {}
        return NextResponse.json({ error: 'Gagal mengambil video TikTok. Pastikan video publik.' }, { status: 400 });
      }

      if (action === 'download_file') {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const json = await res.json();

        if (json.code === 0 && json.data) {
          const targetUrl = isAudio 
            ? json.data.music 
            : (resolution === '1080' || resolution === '1440' || resolution === '2160' ? (json.data.hdplay || json.data.play) : json.data.play);

          const timestamp = Date.now();
          const ext = isAudio ? 'mp3' : 'mp4';
          const filename = `tiktok_nowm_${timestamp}.${ext}`;
          const outputPath = path.join(process.cwd(), 'public/outputs', filename);

          const mediaRes = await fetch(targetUrl);
          const arrayBuffer = await mediaRes.arrayBuffer();
          fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));

          return NextResponse.json({
            success: true,
            downloadUrl: `/api/downloader?file=${filename}`,
            filename,
          });
        }
        return NextResponse.json({ error: 'Gagal mengunduh file TikTok.' }, { status: 400 });
      }
    }

    // ================= 2. YOUTUBE TURBO MULTI-THREAD ENGINE =================
    if (action === 'get_info') {
      const infoCmd = `yt-dlp --dump-json --no-playlist --js-runtimes node --extractor-args "youtube:player_client=ios,android,web" "${cleanUrl}"`;
      const { stdout } = await execAsync(infoCmd);
      const videoInfo = JSON.parse(stdout);

      return NextResponse.json({
        success: true,
        isTikTok: false,
        title: videoInfo.title || 'Video YouTube',
        thumbnail: videoInfo.thumbnail || '',
        duration: videoInfo.duration_string || 'N/A',
        uploader: videoInfo.uploader || videoInfo.channel || 'Kreator',
      });
    }

    if (action === 'download_file') {
      const timestamp = Date.now();
      const ext = isAudio ? 'mp3' : 'mp4';
      const outputFilename = `youtube_${resolution}p_${timestamp}.${ext}`;
      const outputPath = path.join(process.cwd(), 'public/outputs', outputFilename);

      let downloadCmd = '';
      if (isAudio) {
        // Mode Audio Cepat
        downloadCmd = `yt-dlp --no-playlist --js-runtimes node --concurrent-fragments 5 -x --audio-format mp3 -o "${outputPath}" "${cleanUrl}"`;
      } else {
        // Mode Turbo Video: Multi-Thread 5 Jalur + Fast Merging tanpa re-encode
        downloadCmd = `yt-dlp --no-playlist --js-runtimes node --extractor-args "youtube:player_client=ios,android,web" --concurrent-fragments 5 --http-chunk-size 10M -f "bv*[height<=${resolution}]+ba/b[height<=${resolution}]/best" --merge-output-format mp4 -o "${outputPath}" "${cleanUrl}"`;
      }

      await execAsync(downloadCmd);

      if (!fs.existsSync(outputPath)) {
        return NextResponse.json({ error: 'Gagal mengunduh video dalam resolusi ini.' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        downloadUrl: `/api/downloader?file=${outputFilename}`,
        filename: outputFilename,
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error: any) {
    console.error('Downloader Error:', error);
    return NextResponse.json({ error: 'Gagal memproses video: ' + (error.message || 'Error') }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('file');

  if (!filename) return new NextResponse('File missing', { status: 400 });

  const filePath = path.join(process.cwd(), 'public/outputs', path.basename(filename));

  if (!fs.existsSync(filePath)) return new NextResponse('Not found', { status: 404 });

  const fileBuffer = fs.readFileSync(filePath);
  const isMp3 = filename.endsWith('.mp3');

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': isMp3 ? 'audio/mpeg' : 'video/mp4',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Accept-Ranges': 'bytes',
    },
  });
}

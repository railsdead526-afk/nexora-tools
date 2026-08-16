import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

function formatTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const secs = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${hrs}:${mins}:${secs}`;
}

// Cek status PRO langsung ke database server
function checkProStatusServer(email?: string, clientIsPro?: boolean): boolean {
  if (clientIsPro === true) return true;
  if (!email) return false;
  try {
    const filePath = path.join(process.cwd(), 'pro_users.json');
    if (fs.existsSync(filePath)) {
      const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const now = Date.now();
      const found = users.find((u: any) => u.email === email.trim().toLowerCase());
      if (found && found.expiresAt > now) return true;
    }
  } catch (e) {}
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      url, 
      startSeconds = 30, 
      duration = 20, 
      ratio = '9:16', 
      resolution = '720', 
      email,
      isPro: clientIsPro 
    } = body;

    if (!url) {
      return NextResponse.json({ error: 'Link URL video tidak boleh kosong' }, { status: 400 });
    }

    const isUserPro = checkProStatusServer(email, clientIsPro);
    const cleanUrl = url.split('&si=')[0].split('?si=')[0];

    const timestamp = Date.now();
    const inputPath = path.join(process.cwd(), `public/outputs/raw_${timestamp}.mp4`);
    const outputPath = path.join(process.cwd(), `public/outputs/clip_${timestamp}.mp4`);

    try {
      const files = fs.readdirSync(path.join(process.cwd(), 'public/outputs'));
      for (const f of files) {
        if (f.startsWith('raw_') || f.startsWith('input_')) {
          fs.unlinkSync(path.join(process.cwd(), 'public/outputs', f));
        }
      }
    } catch (e) {}

    const startTimeStr = formatTime(Number(startSeconds));
    const endTimeStr = formatTime(Number(startSeconds) + Number(duration));
    const timeRange = `*${startTimeStr}-${endTimeStr}`;

    const downloadCmd = `yt-dlp --no-playlist --js-runtimes node --extractor-args "youtube:player_client=ios,android,web" -f "b[height<=${resolution}]/bv*[height<=${resolution}]+ba/best" --merge-output-format mp4 --download-sections "${timeRange}" --force-keyframes-at-cuts -o "${inputPath}" "${cleanUrl}"`;

    await execAsync(downloadCmd);

    if (!fs.existsSync(inputPath)) {
      return NextResponse.json({ error: 'Gagal mendownload bagian video dari link YouTube.' }, { status: 400 });
    }

    // Filter Crop Video
    let cropFilter = 'format=yuv420p';
    if (ratio === '9:16') {
      cropFilter = 'crop=trunc(ih*9/16/2)*2:trunc(ih/2)*2,format=yuv420p';
    } else if (ratio === '1:1') {
      cropFilter = 'crop=trunc(ih/2)*2:trunc(ih/2)*2,format=yuv420p';
    }

    // Watermark HANYA dipasang jika BUKAN PRO
    if (!isUserPro) {
      cropFilter += `,drawtext=text='NEXORA FREE':x=w-tw-20:y=30:fontsize=24:fontcolor=white@0.8:box=1:boxcolor=black@0.5`;
    }

    const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -t ${duration} -vf "${cropFilter}" -c:v libx264 -preset ultrafast -c:a aac -movflags +faststart "${outputPath}"`;

    await execAsync(ffmpegCmd);

    try { fs.unlinkSync(inputPath); } catch (e) {}

    return NextResponse.json({
      success: true,
      isPro: isUserPro,
      videoUrl: `/api/clipper?file=clip_${timestamp}.mp4`,
      message: isUserPro ? 'Video PRO berhasil dirender tanpa watermark!' : 'Video berhasil dipotong!',
    });
  } catch (error: any) {
    console.error('Processing Error:', error);
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
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Accept-Ranges': 'bytes',
    },
  });
}

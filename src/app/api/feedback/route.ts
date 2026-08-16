import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'feedbacks.json');

export async function POST(req: Request) {
  try {
    const { type, message, email } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    let feedbacks = [];
    if (fs.existsSync(filePath)) {
      try {
        feedbacks = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch (e) {}
    }

    feedbacks.push({
      id: Date.now(),
      type: type || 'Saran',
      message,
      email: email || 'Anonim / Belum Login',
      createdAt: new Date().toLocaleString('id-ID'),
    });

    fs.writeFileSync(filePath, JSON.stringify(feedbacks, null, 2));

    return NextResponse.json({ success: true, message: 'Laporan berhasil dikirim ke Admin!' });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengirim laporan' }, { status: 500 });
  }
}

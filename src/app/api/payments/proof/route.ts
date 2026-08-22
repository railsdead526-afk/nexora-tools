import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Pembayaran manual sudah dinonaktifkan. Gunakan checkout Midtrans untuk mengaktifkan Nexora PRO.',
    },
    { status: 410 },
  );
}

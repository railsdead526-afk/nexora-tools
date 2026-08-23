import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Review pembayaran manual sudah dinonaktifkan karena Nexora memakai Midtrans otomatis.',
    },
    { status: 410 },
  );
}

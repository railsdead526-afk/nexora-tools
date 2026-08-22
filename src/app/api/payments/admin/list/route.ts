import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      error:
        'Daftar review pembayaran manual sudah dinonaktifkan karena Nexora memakai Midtrans otomatis.',
    },
    { status: 410 },
  );
}

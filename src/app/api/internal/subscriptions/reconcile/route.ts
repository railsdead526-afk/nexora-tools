import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { reconcileSubscriptionExpiry } from '@/lib/account/subscription';

export const runtime = 'nodejs';

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7).trim();
  const expectedBytes = Buffer.from(expected, 'utf8');
  const tokenBytes = Buffer.from(token, 'utf8');
  return tokenBytes.length === expectedBytes.length && timingSafeEqual(tokenBytes, expectedBytes);
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expiredCount = await reconcileSubscriptionExpiry();

    return NextResponse.json({
      success: true,
      expiredCount,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Subscription reconciliation error:', error);
    return NextResponse.json(
      { error: 'Gagal merekonsiliasi subscription.' },
      { status: 500 },
    );
  }
}

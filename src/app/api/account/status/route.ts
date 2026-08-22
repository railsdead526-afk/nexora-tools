import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { getAccountSubscriptionStatus } from '@/lib/account/subscription';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await getAccountSubscriptionStatus(user.id);
    const expiresAt = subscription.expiresAt ? new Date(subscription.expiresAt) : null;
    const daysLeft =
      subscription.isPro && expiresAt
        ? Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000))
        : 0;

    return NextResponse.json({
      isPro: subscription.isPro,
      plan: subscription.plan,
      daysLeft,
      expiresAt: subscription.expiresAt,
      status: subscription.status,
    });
  } catch (error) {
    console.error('Account status error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat status akun.' },
      { status: 500 },
    );
  }
}

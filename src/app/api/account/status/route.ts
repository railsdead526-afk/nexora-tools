import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan,status,expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    const expiresAt = data?.expires_at ? new Date(data.expires_at) : null;
    const isPro = data?.plan === 'pro' && data?.status === 'active' && expiresAt !== null && expiresAt.getTime() > Date.now();
    const daysLeft = isPro && expiresAt
      ? Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000))
      : 0;

    return NextResponse.json({
      isPro,
      plan: isPro ? 'pro' : 'free',
      daysLeft,
      expiresAt: isPro ? expiresAt?.toISOString() : null,
    });
  } catch (error) {
    console.error('Account status error:', error);
    return NextResponse.json({ error: 'Gagal memuat status akun.' }, { status: 500 });
  }
}

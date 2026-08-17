import type { AccountPlan } from '@/config/quotas';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface AccountSubscriptionStatus {
  plan: AccountPlan;
  isPro: boolean;
  status: 'active' | 'expired' | 'cancelled' | null;
  expiresAt: string | null;
}

export async function getAccountSubscriptionStatus(
  userId: string,
): Promise<AccountSubscriptionStatus> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan,status,expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const expiresAt = data?.expires_at
    ? new Date(data.expires_at)
    : null;

  const isPro =
    data?.plan === 'pro' &&
    data?.status === 'active' &&
    expiresAt !== null &&
    expiresAt.getTime() > Date.now();

  return {
    plan: isPro ? 'pro' : 'free',
    isPro,
    status: data?.status ?? null,
    expiresAt:
      isPro && expiresAt
        ? expiresAt.toISOString()
        : null,
  };
}

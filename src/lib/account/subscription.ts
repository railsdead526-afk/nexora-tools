import type { AccountPlan } from '@/config/quotas';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface AccountSubscriptionStatus {
  plan: AccountPlan;
  isPro: boolean;
  status: 'active' | 'expired' | 'cancelled' | null;
  expiresAt: string | null;
}

type SubscriptionRow = {
  plan: 'free' | 'pro';
  status: 'active' | 'expired' | 'cancelled';
  expires_at: string | null;
} | null;

function mapSubscriptionStatus(row: SubscriptionRow): AccountSubscriptionStatus {
  const expiresAt = row?.expires_at ? new Date(row.expires_at) : null;
  const isPro =
    row?.plan === 'pro' &&
    row?.status === 'active' &&
    expiresAt !== null &&
    expiresAt.getTime() > Date.now();

  return {
    plan: isPro ? 'pro' : 'free',
    isPro,
    status: row?.status ?? null,
    expiresAt: isPro && expiresAt ? expiresAt.toISOString() : null,
  };
}

export async function reconcileSubscriptionExpiry(userId?: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('reconcile_subscription_expiry', {
    p_user_id: userId ?? null,
  });

  if (error) throw error;
  return Number(data || 0);
}

async function getSubscriptionRow(userId: string): Promise<SubscriptionRow> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan,status,expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SubscriptionRow) ?? null;
}

export async function getAccountSubscriptionStatus(
  userId: string,
): Promise<AccountSubscriptionStatus> {
  await reconcileSubscriptionExpiry(userId);
  const row = await getSubscriptionRow(userId);
  return mapSubscriptionStatus(row);
}

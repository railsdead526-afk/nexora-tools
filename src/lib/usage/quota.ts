import { getQuotaLimit, type QuotaTool } from '@/config/quotas';
import { getAccountSubscriptionStatus } from '@/lib/account/subscription';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface ToolQuotaStatus {
  tool: QuotaTool;
  plan: 'free' | 'pro';
  limit: number;
  used: number;
  remaining: number;
  usageDate: string;
  allowed: boolean;
}

function getJakartaDate() {
  // WIB tidak memakai DST, sehingga penambahan UTC+7 aman untuk batas harian Nexora.
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function getToolQuotaStatus(userId: string, tool: QuotaTool): Promise<ToolQuotaStatus> {
  const subscription = await getAccountSubscriptionStatus(userId);
  const limit = getQuotaLimit(tool, subscription.plan);
  const usageDate = getJakartaDate();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('usage_daily')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('tool', tool)
    .eq('usage_date', usageDate)
    .maybeSingle();

  if (error) throw error;

  const used = Math.max(0, Number(data?.usage_count || 0));
  const remaining = Math.max(0, limit - used);

  return {
    tool,
    plan: subscription.plan,
    limit,
    used,
    remaining,
    usageDate,
    allowed: remaining > 0,
  };
}

export async function consumeToolQuota(userId: string, tool: QuotaTool): Promise<ToolQuotaStatus> {
  const subscription = await getAccountSubscriptionStatus(userId);
  const limit = getQuotaLimit(tool, subscription.plan);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase.rpc('consume_tool_quota', {
    p_user_id: userId,
    p_tool: tool,
    p_limit: limit,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Quota service did not return a result.');

  return {
    tool,
    plan: subscription.plan,
    limit,
    used: Number(row.used || 0),
    remaining: Math.max(0, Number(row.remaining || 0)),
    usageDate: String(row.usage_date || getJakartaDate()),
    allowed: Boolean(row.allowed),
  };
}


export async function refundToolQuota(userId: string, tool: QuotaTool) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc('refund_tool_quota', {
    p_user_id: userId,
    p_tool: tool,
  });

  if (error) {
    console.error('Quota refund error:', error);
  }
}

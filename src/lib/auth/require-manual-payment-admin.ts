import type { User } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth/require-user';

function valuesFromEnv(name: string) {
  return new Set(
    (process.env[name] || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isManualPaymentAdmin(user: User) {
  const adminEmails = valuesFromEnv('MANUAL_PAYMENT_ADMIN_EMAILS');
  const adminUserIds = valuesFromEnv('MANUAL_PAYMENT_ADMIN_USER_IDS');
  const email = user.email?.trim().toLowerCase() || '';

  return adminEmails.has(email) || adminUserIds.has(user.id.toLowerCase());
}

export async function getManualPaymentAdmin(request: Request) {
  const user = await getUserFromRequest(request);
  return user && isManualPaymentAdmin(user) ? user : null;
}

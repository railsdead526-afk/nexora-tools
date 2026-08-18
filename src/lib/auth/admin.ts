import type { User } from '@supabase/supabase-js';

function parseList(value?: string) {
  return new Set(
    (value || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminUser(user: User): boolean {
  const adminIds = parseList(process.env.ADMIN_USER_IDS);
  const adminEmails = parseList(process.env.ADMIN_EMAILS);

  if (adminIds.has(user.id.toLowerCase())) {
    return true;
  }

  const email = user.email?.trim().toLowerCase();

  return Boolean(email && adminEmails.has(email));
}

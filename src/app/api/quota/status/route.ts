import { NextResponse } from 'next/server';
import { isQuotaTool } from '@/config/quotas';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { getToolQuotaStatus } from '@/lib/usage/quota';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Login diperlukan.' }, { status: 401 });

    const url = new URL(request.url);
    const tool = String(url.searchParams.get('tool') || '');

    if (!isQuotaTool(tool)) {
      return NextResponse.json({ error: 'Tool quota tidak valid.' }, { status: 400 });
    }

    const quota = await getToolQuotaStatus(user.id, tool);
    return NextResponse.json(quota);
  } catch (error) {
    console.error('Quota status error:', error);
    return NextResponse.json({ error: 'Gagal memuat quota.' }, { status: 500 });
  }
}

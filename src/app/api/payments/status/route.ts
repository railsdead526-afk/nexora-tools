import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId')?.trim();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID diperlukan.' },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('payments')
      .select(
        'provider_order_id,provider,amount,currency,status,created_at,submitted_at,reviewed_at,review_note,paid_at',
      )
      .eq('provider_order_id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Pembayaran tidak ditemukan.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      orderId: data.provider_order_id,
      provider: data.provider,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      createdAt: data.created_at,
      submittedAt: data.submitted_at,
      reviewedAt: data.reviewed_at,
      reviewNote: data.review_note,
      paidAt: data.paid_at,
    });
  } catch (error) {
    console.error('Payment status error:', error);

    return NextResponse.json(
      { error: 'Gagal memuat status pembayaran.' },
      { status: 500 },
    );
  }
}

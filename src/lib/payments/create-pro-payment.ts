import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getManualPaymentInstructions,
} from '@/lib/payments/manual';
import { PRO_PRICE } from '@/lib/payments/config';
import { consumeRateLimit, rateLimitResponse } from '@/lib/security/rate-limit';

export async function createProPaymentOrder(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu.' },
        { status: 401 },
      );
    }

    const rate = consumeRateLimit(`payment-create:${user.id}`, 3, 10 * 60_000);
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSeconds, 'Terlalu banyak percobaan pembayaran. Coba lagi nanti.');
    }

    const instructions = getManualPaymentInstructions();
    if (instructions.accountNumber.includes('ISI_')) {
      return NextResponse.json(
        { error: 'Rekening pembayaran belum dikonfigurasi oleh admin.' },
        { status: 503 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc('create_manual_payment_order', {
      p_user_id: user.id,
      p_amount: PRO_PRICE,
      p_email: user.email ?? null,
    });

    if (error) throw error;

    const order = Array.isArray(data) ? data[0] : data;
    if (!order?.provider_order_id) {
      throw new Error('Manual payment order tidak dibuat.');
    }

    return NextResponse.json({
      orderId: order.provider_order_id,
      amount: Number(order.amount),
      currency: order.currency,
      status: order.status,
      createdAt: order.created_at,
      instructions,
    });
  } catch (error) {
    console.error('Create manual payment error:', error);

    return NextResponse.json(
      { error: 'Gagal menyiapkan pembayaran manual. Coba lagi.' },
      { status: 500 },
    );
  }
}

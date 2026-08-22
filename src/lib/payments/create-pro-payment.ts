import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createMidtransSnapTransaction } from '@/lib/payments/midtrans';
import { PRO_PAYMENT_PROVIDER, PRO_PRICE } from '@/lib/payments/config';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

export async function createProPaymentOrder(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu.' },
        { status: 401 },
      );
    }

    if (!APP_URL) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_APP_URL belum dikonfigurasi.' },
        { status: 500 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const orderId = `NXR-PRO-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const { error: insertError } = await supabase.from('payments').insert({
      user_id: user.id,
      provider: PRO_PAYMENT_PROVIDER,
      provider_order_id: orderId,
      amount: PRO_PRICE,
      currency: 'IDR',
      status: 'pending',
    });

    if (insertError) {
      throw insertError;
    }

    try {
      const checkout = await createMidtransSnapTransaction({
        orderId,
        amount: PRO_PRICE,
        email: user.email ?? '',
        finishUrl: `${APP_URL}/payment/finish?orderId=${encodeURIComponent(orderId)}`,
        notificationUrl: `${APP_URL}/api/payments/midtrans/webhook`,
      });

      return NextResponse.json({
        orderId,
        amount: PRO_PRICE,
        status: 'pending',
        reused: false,
        checkout,
      });
    } catch (error) {
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('provider_order_id', orderId)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      throw error;
    }
  } catch (error) {
    console.error('Create Midtrans payment error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Gagal membuat pembayaran Midtrans.',
      },
      { status: 500 },
    );
  }
}

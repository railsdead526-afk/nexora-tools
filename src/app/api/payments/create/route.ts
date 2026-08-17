import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createMidtransSnapTransaction } from '@/lib/payments/midtrans';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const PRO_PRICE = 49_000;

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user?.email) return NextResponse.json({ error: 'Silakan login terlebih dahulu.' }, { status: 401 });

    const supabase = createSupabaseAdminClient();
    const orderId = `NXR-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const { error: insertError } = await supabase.from('payments').insert({
      user_id: user.id,
      provider: 'midtrans',
      provider_order_id: orderId,
      amount: PRO_PRICE,
      currency: 'IDR',
      status: 'pending',
    });

    if (insertError) throw insertError;

    const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const transaction = await createMidtransSnapTransaction({
      orderId,
      amount: PRO_PRICE,
      email: user.email,
      finishUrl: `${origin}/payment/finish`,
      notificationUrl: `${origin}/api/payments/midtrans/webhook`,
    });

    return NextResponse.json({
      orderId,
      amount: PRO_PRICE,
      redirectUrl: transaction.redirectUrl,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal membuat pembayaran.' },
      { status: 500 },
    );
  }
}

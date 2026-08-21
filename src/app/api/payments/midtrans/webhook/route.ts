import { NextResponse } from 'next/server';
import {
  getMidtransMerchantId,
  mapMidtransStatus,
  type MidtransNotification,
  verifyMidtransSignature,
} from '@/lib/payments/midtrans';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as MidtransNotification;

    if (!payload.order_id || !payload.signature_key || !verifyMidtransSignature(payload)) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
    }

    const configuredMerchantId = getMidtransMerchantId();
    if (configuredMerchantId && payload.merchant_id !== configuredMerchantId) {
      return NextResponse.json({ error: 'Invalid merchant.' }, { status: 403 });
    }

    const grossAmount = Number(payload.gross_amount);
    if (!Number.isInteger(grossAmount) || grossAmount <= 0) {
      return NextResponse.json({ error: 'Invalid gross amount.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: payment, error: lookupError } = await supabase
      .from('payments')
      .select('id,provider,provider_order_id,amount,currency,status')
      .eq('provider_order_id', payload.order_id)
      .eq('provider', 'midtrans')
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }

    if (payment.currency !== 'IDR' || payment.amount !== grossAmount) {
      return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 409 });
    }

    const status = mapMidtransStatus(payload);

    if (status === 'paid') {
      const paidAt = payload.settlement_time || payload.transaction_time || new Date().toISOString();
      const { error } = await supabase.rpc('activate_midtrans_subscription', {
        p_order_id: payload.order_id,
        p_provider_payment_id: payload.transaction_id || null,
        p_paid_at: paidAt,
        p_amount: grossAmount,
      });

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('payments')
        .update({
          status,
          provider_payment_id: payload.transaction_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
        .neq('status', 'paid');

      if (error) throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Midtrans webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}

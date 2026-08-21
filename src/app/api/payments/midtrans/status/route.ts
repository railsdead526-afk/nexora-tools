import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getMidtransMerchantId,
  getMidtransTransactionStatus,
  mapMidtransStatus,
} from '@/lib/payments/midtrans';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = new URL(request.url).searchParams.get('orderId')?.trim();
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID diperlukan.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: payment, error: lookupError } = await supabase
      .from('payments')
      .select('id,provider,provider_order_id,amount,currency,status,paid_at')
      .eq('user_id', user.id)
      .eq('provider_order_id', orderId)
      .eq('provider', 'midtrans')
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!payment) {
      return NextResponse.json({ error: 'Pembayaran tidak ditemukan.' }, { status: 404 });
    }

    if (payment.status === 'paid') {
      return NextResponse.json({
        orderId,
        status: 'paid',
        paidAt: payment.paid_at,
        reconciled: false,
      });
    }

    const remote = await getMidtransTransactionStatus(orderId);
    const configuredMerchantId = getMidtransMerchantId();
    if (configuredMerchantId && remote.merchant_id && remote.merchant_id !== configuredMerchantId) {
      return NextResponse.json({ error: 'Invalid merchant.' }, { status: 403 });
    }

    const grossAmount = Number(remote.gross_amount);
    if (!Number.isInteger(grossAmount) || grossAmount <= 0 || grossAmount !== payment.amount || remote.currency && remote.currency !== payment.currency) {
      return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 409 });
    }

    const mappedStatus = mapMidtransStatus({
      status_code: remote.status_code,
      transaction_status: remote.transaction_status,
      fraud_status: remote.fraud_status,
    });

    if (mappedStatus === 'paid') {
      const { error } = await supabase.rpc('activate_midtrans_subscription', {
        p_order_id: orderId,
        p_provider_payment_id: remote.transaction_id || null,
        p_paid_at: remote.settlement_time || remote.transaction_time || new Date().toISOString(),
        p_amount: grossAmount,
      });
      if (error) throw error;
    } else if (mappedStatus !== 'pending') {
      const { error } = await supabase
        .from('payments')
        .update({
          status: mappedStatus,
          provider_payment_id: remote.transaction_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
        .neq('status', 'paid');
      if (error) throw error;
    }

    return NextResponse.json({
      orderId,
      status: mappedStatus,
      transactionStatus: remote.transaction_status,
      transactionId: remote.transaction_id || null,
      reconciled: true,
    });
  } catch (error) {
    console.error('Midtrans status reconciliation error:', error);
    return NextResponse.json({ error: 'Gagal memeriksa status pembayaran.' }, { status: 500 });
  }
}

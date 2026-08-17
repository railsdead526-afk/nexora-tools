import { NextResponse } from 'next/server';
import {
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

    const status = mapMidtransStatus(payload);
    const supabase = createSupabaseAdminClient();

    if (status === 'paid') {
      const paidAt = payload.settlement_time || payload.transaction_time || new Date().toISOString();
      const { error } = await supabase.rpc('activate_pro_subscription', {
        p_order_id: payload.order_id,
        p_provider_payment_id: payload.transaction_id || null,
        p_paid_at: paidAt,
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
        .eq('provider_order_id', payload.order_id)
        .neq('status', 'paid');

      if (error) throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Midtrans webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}

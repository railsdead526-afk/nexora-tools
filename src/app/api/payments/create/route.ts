import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getDanaPaymentConfig,
  PRO_PRICE,
} from '@/lib/payments/config';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu.' },
        { status: 401 },
      );
    }

    const dana = getDanaPaymentConfig();
    const supabase = createSupabaseAdminClient();

    const { data: existing, error: existingError } =
      await supabase
        .from('payments')
        .select(
          'id,provider_order_id,amount,status,created_at,submitted_at',
        )
        .eq('user_id', user.id)
        .eq('provider', 'dana_manual')
        .in('status', ['pending', 'pending_review'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return NextResponse.json({
        orderId: existing.provider_order_id,
        amount: existing.amount,
        status: existing.status,
        accountName: dana.accountName,
        accountNumber: dana.accountNumber,
        reused: true,
      });
    }

    const orderId =
      `NXR-DANA-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const { data: payment, error: insertError } =
      await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          provider: 'dana_manual',
          provider_order_id: orderId,
          amount: PRO_PRICE,
          currency: 'IDR',
          status: 'pending',
        })
        .select(
          'provider_order_id,amount,status,created_at',
        )
        .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      orderId: payment.provider_order_id,
      amount: payment.amount,
      status: payment.status,
      accountName: dana.accountName,
      accountNumber: dana.accountNumber,
      reused: false,
    });
  } catch (error) {
    console.error('Create DANA payment error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Gagal membuat pembayaran.',
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { getManualPaymentAdmin } from '@/lib/auth/require-manual-payment-admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await getManualPaymentAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: payments, error } = await supabase
      .from('payments')
      .select(
        'provider_order_id,user_id,payer_email,amount,currency,status,proof_path,submitted_at,reviewed_at,review_note,created_at',
      )
      .in('provider', ['manual_bank', 'dana_manual'])
      .order('submitted_at', { ascending: false, nullsFirst: false })
      .limit(100);

    if (error) throw error;

    const items = await Promise.all(
      (payments || []).map(async (payment) => {
        let proofUrl: string | null = null;
        if (payment.proof_path) {
          const signed = await supabase.storage
            .from('payment-proofs')
            .createSignedUrl(payment.proof_path, 600);
          proofUrl = signed.data?.signedUrl || null;
        }

        return {
          orderId: payment.provider_order_id,
          userId: payment.user_id,
          email: payment.payer_email,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          proofUrl,
          submittedAt: payment.submitted_at,
          reviewedAt: payment.reviewed_at,
          reviewNote: payment.review_note,
          createdAt: payment.created_at,
        };
      }),
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Manual payment admin list error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat daftar pembayaran manual.' },
      { status: 500 },
    );
  }
}

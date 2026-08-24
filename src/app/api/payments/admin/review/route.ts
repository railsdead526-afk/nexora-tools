import { NextResponse } from 'next/server';
import { getManualPaymentAdmin } from '@/lib/auth/require-manual-payment-admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const admin = await getManualPaymentAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 403 });
    }

    const body = await request.json();
    const orderId = String(body?.orderId || '').trim();
    const action = String(body?.action || '').trim();
    const note = String(body?.note || '').trim().slice(0, 500);

    if (!/^NXR-MANUAL-[A-Z0-9]{20}$/.test(orderId)) {
      return NextResponse.json({ error: 'Order ID tidak valid.' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Aksi review tidak valid.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.rpc('review_manual_payment', {
      p_order_id: orderId,
      p_reviewer_id: admin.id,
      p_action: action,
      p_note: note || null,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, orderId, status: action === 'approve' ? 'paid' : 'rejected' });
  } catch (error) {
    console.error('Manual payment review error:', error);
    return NextResponse.json(
      { error: 'Gagal memproses review pembayaran.' },
      { status: 500 },
    );
  }
}

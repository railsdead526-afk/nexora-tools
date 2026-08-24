import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { consumeRateLimit, rateLimitResponse } from '@/lib/security/rate-limit';
import {
  ALLOWED_PROOF_TYPES,
  hashProof,
  MAX_PROOF_BYTES,
  PAYMENT_PROOF_BUCKET,
  safeProofExtension,
} from '@/lib/payments/manual';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Login diperlukan.' }, { status: 401 });
    }

    const rate = consumeRateLimit(`payment-proof:${user.id}`, 5, 60 * 60_000);
    if (!rate.allowed) {
      return rateLimitResponse(rate.retryAfterSeconds, 'Terlalu banyak upload bukti. Coba lagi nanti.');
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_PROOF_BYTES + 256_000) {
      return NextResponse.json({ error: 'Ukuran upload terlalu besar.' }, { status: 413 });
    }

    const formData = await request.formData();
    const orderId = String(formData.get('orderId') || '').trim();
    const proof = formData.get('proof');

    if (!/^NXR-MANUAL-[A-Z0-9]{20}$/.test(orderId)) {
      return NextResponse.json({ error: 'Order ID tidak valid.' }, { status: 400 });
    }

    if (!(proof instanceof File)) {
      return NextResponse.json({ error: 'Bukti pembayaran wajib diunggah.' }, { status: 400 });
    }

    if (!ALLOWED_PROOF_TYPES.has(proof.type)) {
      return NextResponse.json(
        { error: 'Bukti harus berupa JPG, PNG, atau PDF.' },
        { status: 400 },
      );
    }

    if (proof.size <= 0 || proof.size > MAX_PROOF_BYTES) {
      return NextResponse.json(
        { error: 'Ukuran bukti harus lebih dari 0 dan maksimal 5 MB.' },
        { status: 413 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data: payment, error: lookupError } = await supabase
      .from('payments')
      .select('id,status,provider')
      .eq('provider_order_id', orderId)
      .eq('user_id', user.id)
      .in('provider', ['manual_bank', 'dana_manual'])
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!payment) {
      return NextResponse.json({ error: 'Pembayaran tidak ditemukan.' }, { status: 404 });
    }

    if (payment.status === 'paid') {
      return NextResponse.json({ error: 'Pembayaran ini sudah disetujui.' }, { status: 409 });
    }

    const bytes = new Uint8Array(await proof.arrayBuffer());
    const extension = safeProofExtension(proof.type);
    const proofPath = `${user.id}/${orderId}.${extension}`;
    const proofReference = `manual-proof-${hashProof(bytes).slice(0, 24)}`;

    const { error: uploadError } = await supabase.storage
      .from(PAYMENT_PROOF_BUCKET)
      .upload(proofPath, bytes, {
        contentType: proof.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'pending_review',
        proof_path: proofPath,
        provider_payment_id: proofReference,
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        review_note: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)
      .eq('user_id', user.id)
      .neq('status', 'paid');

    if (updateError) {
      await supabase.storage.from(PAYMENT_PROOF_BUCKET).remove([proofPath]);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: 'pending_review',
    });
  } catch (error) {
    console.error('Manual payment proof error:', error);
    return NextResponse.json(
      { error: 'Gagal mengunggah bukti pembayaran.' },
      { status: 500 },
    );
  }
}

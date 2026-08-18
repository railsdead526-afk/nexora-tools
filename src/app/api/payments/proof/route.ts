import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: Request) {
  let uploadedPath: string | null = null;

  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu.' },
        { status: 401 },
      );
    }

    const formData = await request.formData();

    const orderIdValue = formData.get('orderId');
    const proofValue = formData.get('proof');

    const orderId =
      typeof orderIdValue === 'string'
        ? orderIdValue.trim()
        : '';

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID tidak valid.' },
        { status: 400 },
      );
    }

    if (!(proofValue instanceof File)) {
      return NextResponse.json(
        { error: 'Pilih gambar bukti transfer.' },
        { status: 400 },
      );
    }

    const extension = MIME_EXTENSIONS[proofValue.type];

    if (!extension) {
      return NextResponse.json(
        {
          error:
            'Format bukti transfer harus JPG, PNG, atau WebP.',
        },
        { status: 415 },
      );
    }

    if (proofValue.size <= 0) {
      return NextResponse.json(
        { error: 'File bukti transfer kosong.' },
        { status: 400 },
      );
    }

    if (proofValue.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            'Ukuran bukti transfer maksimal 4 MB.',
        },
        { status: 413 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: payment, error: paymentError } =
      await supabase
        .from('payments')
        .select(
          'id,status,provider,proof_path,provider_order_id',
        )
        .eq('provider_order_id', orderId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (paymentError) {
      throw paymentError;
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Pembayaran tidak ditemukan.' },
        { status: 404 },
      );
    }

    if (payment.provider !== 'dana_manual') {
      return NextResponse.json(
        { error: 'Metode pembayaran tidak sesuai.' },
        { status: 400 },
      );
    }

    if (
      payment.status !== 'pending' &&
      payment.status !== 'rejected'
    ) {
      return NextResponse.json(
        {
          error:
            payment.status === 'pending_review'
              ? 'Bukti transfer sudah dikirim dan sedang diperiksa.'
              : 'Pembayaran ini tidak dapat menerima bukti baru.',
        },
        { status: 409 },
      );
    }

    uploadedPath =
      `${user.id}/${payment.id}/` +
      `${randomUUID()}.${extension}`;

    const bytes = Buffer.from(
      await proofValue.arrayBuffer(),
    );

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(uploadedPath, bytes, {
        contentType: proofValue.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const oldProofPath = payment.proof_path;

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        proof_path: uploadedPath,
        status: 'pending_review',
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        review_note: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id)
      .eq('user_id', user.id);

    if (updateError) {
      await supabase.storage
        .from('payment-proofs')
        .remove([uploadedPath]);

      uploadedPath = null;
      throw updateError;
    }

    if (oldProofPath && oldProofPath !== uploadedPath) {
      await supabase.storage
        .from('payment-proofs')
        .remove([oldProofPath]);
    }

    return NextResponse.json({
      success: true,
      orderId: payment.provider_order_id,
      status: 'pending_review',
      message:
        'Bukti transfer berhasil dikirim dan menunggu verifikasi admin.',
    });
  } catch (error) {
    console.error('Upload payment proof error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Gagal mengunggah bukti transfer.',
      },
      { status: 500 },
    );
  }
}

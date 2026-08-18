import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

type ProofBody = {
  orderId?: unknown;
  fileName?: unknown;
  mimeType?: unknown;
  dataBase64?: unknown;
};

function hasValidSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === 'image/jpeg') {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (mimeType === 'image/png') {
    const signature = [
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a,
    ];

    return (
      buffer.length >= signature.length &&
      signature.every(
        (value, index) => buffer[index] === value,
      )
    );
  }

  if (mimeType === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  return false;
}

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

    const body = (await request.json()) as ProofBody;

    const orderId =
      typeof body.orderId === 'string'
        ? body.orderId.trim()
        : '';

    const mimeType =
      typeof body.mimeType === 'string'
        ? body.mimeType.trim().toLowerCase()
        : '';

    const dataBase64 =
      typeof body.dataBase64 === 'string'
        ? body.dataBase64.trim()
        : '';

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID tidak valid.' },
        { status: 400 },
      );
    }

    const extension = MIME_EXTENSIONS[mimeType];

    if (!extension) {
      return NextResponse.json(
        {
          error:
            'Format bukti transfer harus JPG, PNG, atau WebP.',
        },
        { status: 415 },
      );
    }

    if (!dataBase64) {
      return NextResponse.json(
        { error: 'Data bukti transfer kosong.' },
        { status: 400 },
      );
    }

    let bytes: Buffer;

    try {
      bytes = Buffer.from(dataBase64, 'base64');
    } catch {
      return NextResponse.json(
        { error: 'Data gambar tidak valid.' },
        { status: 400 },
      );
    }

    if (bytes.length <= 0) {
      return NextResponse.json(
        { error: 'File bukti transfer kosong.' },
        { status: 400 },
      );
    }

    if (bytes.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            'Ukuran bukti transfer maksimal 2 MB.',
        },
        { status: 413 },
      );
    }

    if (!hasValidSignature(bytes, mimeType)) {
      return NextResponse.json(
        {
          error:
            'Isi file tidak cocok dengan format gambar yang dipilih.',
        },
        { status: 415 },
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

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(uploadedPath, bytes, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const oldProofPath = payment.proof_path;
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        proof_path: uploadedPath,
        status: 'pending_review',
        submitted_at: now,
        reviewed_at: null,
        reviewed_by: null,
        review_note: null,
        updated_at: now,
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

import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/require-user';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 3 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

type PrepareBody = {
  action: 'prepare';
  orderId?: unknown;
  mimeType?: unknown;
  size?: unknown;
};

type FinalizeBody = {
  action: 'finalize';
  orderId?: unknown;
  path?: unknown;
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

async function getPayment(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  orderId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from('payments')
    .select(
      'id,status,provider,proof_path,provider_order_id',
    )
    .eq('provider_order_id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Silakan login terlebih dahulu.' },
        { status: 401 },
      );
    }

    const body = (await request.json()) as
      | PrepareBody
      | FinalizeBody;

    const orderId =
      typeof body.orderId === 'string'
        ? body.orderId.trim()
        : '';

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID tidak valid.' },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const payment = await getPayment(
      supabase,
      orderId,
      user.id,
    );

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

    if (body.action === 'prepare') {
      const mimeType =
        typeof body.mimeType === 'string'
          ? body.mimeType.trim().toLowerCase()
          : '';

      const size =
        typeof body.size === 'number'
          ? body.size
          : Number.NaN;

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

      if (
        !Number.isFinite(size) ||
        size <= 0 ||
        size > MAX_FILE_SIZE
      ) {
        return NextResponse.json(
          {
            error:
              'Ukuran bukti transfer harus lebih dari 0 dan maksimal 3 MB.',
          },
          { status: 413 },
        );
      }

      const path =
        `${user.id}/${payment.id}/` +
        `${randomUUID()}.${extension}`;

      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUploadUrl(path);

      if (error || !data?.token) {
        throw error || new Error(
          'Gagal membuat signed upload token.',
        );
      }

      return NextResponse.json({
        success: true,
        path,
        token: data.token,
      });
    }

    if (body.action === 'finalize') {
      const path =
        typeof body.path === 'string'
          ? body.path.trim()
          : '';

      const requiredPrefix =
        `${user.id}/${payment.id}/`;

      if (!path || !path.startsWith(requiredPrefix)) {
        return NextResponse.json(
          { error: 'Path bukti transfer tidak valid.' },
          { status: 400 },
        );
      }

      const { data: fileBlob, error: downloadError } =
        await supabase.storage
          .from('payment-proofs')
          .download(path);

      if (downloadError || !fileBlob) {
        return NextResponse.json(
          {
            error:
              'File bukti transfer belum ditemukan di penyimpanan.',
          },
          { status: 400 },
        );
      }

      const bytes = Buffer.from(
        await fileBlob.arrayBuffer(),
      );

      if (
        bytes.length <= 0 ||
        bytes.length > MAX_FILE_SIZE
      ) {
        await supabase.storage
          .from('payment-proofs')
          .remove([path]);

        return NextResponse.json(
          {
            error:
              'Ukuran file bukti transfer tidak valid.',
          },
          { status: 413 },
        );
      }

      const lowerPath = path.toLowerCase();
      const expectedMime =
        lowerPath.endsWith('.jpg') ||
        lowerPath.endsWith('.jpeg')
          ? 'image/jpeg'
          : lowerPath.endsWith('.png')
            ? 'image/png'
            : lowerPath.endsWith('.webp')
              ? 'image/webp'
              : '';

      if (
        !expectedMime ||
        !hasValidSignature(bytes, expectedMime)
      ) {
        await supabase.storage
          .from('payment-proofs')
          .remove([path]);

        return NextResponse.json(
          {
            error:
              'Isi file bukan gambar JPG, PNG, atau WebP yang valid.',
          },
          { status: 415 },
        );
      }

      const oldProofPath = payment.proof_path;
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          proof_path: path,
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
          .remove([path]);

        throw updateError;
      }

      if (oldProofPath && oldProofPath !== path) {
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
    }

    return NextResponse.json(
      { error: 'Action tidak valid.' },
      { status: 400 },
    );
  } catch (error) {
    console.error('Payment proof error:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Gagal memproses bukti transfer.',
      },
      { status: 500 },
    );
  }
}

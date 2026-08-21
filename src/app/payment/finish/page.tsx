'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';

type PaymentStatus = {
  orderId: string;
  amount: number;
  status: string;
  paidAt?: string | null;
};

function PaymentFinishContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { session, refreshStatus } = useUser();

  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reconcileMidtrans = useCallback(async () => {
    if (!session?.access_token || !orderId) return;

    const response = await fetch(
      `/api/payments/midtrans/status?orderId=${encodeURIComponent(orderId)}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) return;
    const data = await response.json();
    if (data?.status === 'paid') {
      await refreshStatus();
    }
  }, [orderId, refreshStatus, session?.access_token]);

  const loadStatus = useCallback(async () => {
    if (!session?.access_token || !orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await reconcileMidtrans();

      const response = await fetch(
        `/api/payments/status?orderId=${encodeURIComponent(orderId)}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: 'no-store',
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Gagal memuat status pembayaran.');
      }

      setPayment(data);
      if (data.status === 'paid') {
        await refreshStatus();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat status pembayaran.',
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, reconcileMidtrans, refreshStatus, session?.access_token]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const isPaid = payment?.status === 'paid';
  const isFailed = payment?.status === 'failed';
  const isExpired = payment?.status === 'expired';
  const isCancelled = payment?.status === 'cancelled';
  const isRefunded = payment?.status === 'refunded';

  let title = 'Pembayaran belum selesai';
  let description = 'Selesaikan pembayaran di Midtrans. Status akan diperbarui otomatis setelah transaksi terverifikasi.';
  let icon = <Clock3 className="mx-auto h-12 w-12 text-amber-400" />;

  if (isPaid) {
    title = 'Pembayaran berhasil';
    description = 'Nexora PRO sudah aktif di akun kamu selama 30 hari.';
    icon = <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />;
  } else if (isFailed) {
    title = 'Pembayaran gagal';
    description = 'Transaksi tidak berhasil. Buat pembayaran baru dari halaman harga untuk mencoba lagi.';
    icon = <XCircle className="mx-auto h-12 w-12 text-red-400" />;
  } else if (isExpired) {
    title = 'Pembayaran kedaluwarsa';
    description = 'Sesi pembayaran sudah berakhir. Buat pembayaran baru dari halaman harga.';
    icon = <Clock3 className="mx-auto h-12 w-12 text-slate-400" />;
  } else if (isCancelled) {
    title = 'Pembayaran dibatalkan';
    description = 'Transaksi dibatalkan dan belum mengaktifkan Nexora PRO.';
    icon = <XCircle className="mx-auto h-12 w-12 text-red-400" />;
  } else if (isRefunded) {
    title = 'Pembayaran dikembalikan';
    description = 'Transaksi ini sudah direfund. Akses PRO mengikuti status pembayaran yang terverifikasi.';
    icon = <XCircle className="mx-auto h-12 w-12 text-slate-400" />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl">
        {!orderId ? (
          <>
            <XCircle className="mx-auto h-11 w-11 text-red-400" />
            <h1 className="text-xl font-black text-white">Order ID tidak ditemukan</h1>
            <p className="text-sm text-slate-400">Buka kembali pembayaran dari halaman harga.</p>
          </>
        ) : loading ? (
          <>
            <Loader2 className="mx-auto h-11 w-11 animate-spin text-indigo-400" />
            <h1 className="text-xl font-black text-white">Memeriksa status pembayaran</h1>
            <p className="text-sm text-slate-400">Kami sedang mencocokkan status transaksi dengan Midtrans.</p>
          </>
        ) : error ? (
          <>
            <XCircle className="mx-auto h-11 w-11 text-red-400" />
            <h1 className="text-xl font-black text-white">Status gagal dimuat</h1>
            <p className="text-sm text-red-300">{error}</p>
          </>
        ) : (
          <>
            {icon}
            <h1 className="text-2xl font-black text-white">{title}</h1>
            <p className="text-sm leading-relaxed text-slate-400">{description}</p>
          </>
        )}

        {payment && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Order ID</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-300">{payment.orderId}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</p>
                <p className="mt-1 text-xs font-bold uppercase text-slate-200">{payment.status}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nominal</p>
                <p className="mt-1 text-xs font-bold text-slate-200">Rp{payment.amount.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        )}

        {orderId && !isPaid && (
          <button
            type="button"
            onClick={() => void loadStatus()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-3 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Cek Status Lagi
          </button>
        )}

        <Link
          href={isFailed || isExpired || isCancelled || !orderId ? '/pricing' : '/'}
          className="block w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500"
        >
          {isFailed || isExpired || isCancelled || !orderId ? 'Kembali ke Pembayaran' : 'Kembali ke Nexora'}
        </Link>
      </div>
    </div>
  );
}

export default function PaymentFinishPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-slate-400">
          Memuat pembayaran...
        </div>
      }
    >
      <PaymentFinishContent />
    </Suspense>
  );
}

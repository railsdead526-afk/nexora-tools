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
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  paidAt?: string | null;
};

function PaymentFinishContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { session, refreshStatus } = useUser();

  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    if (!session?.access_token || !orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
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
  }, [orderId, refreshStatus, session?.access_token]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const isPaid = payment?.status === 'paid';
  const isRejected = payment?.status === 'rejected';
  const isReview = payment?.status === 'pending_review';

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
            <h1 className="text-xl font-black text-white">Memuat status pembayaran</h1>
          </>
        ) : error ? (
          <>
            <XCircle className="mx-auto h-11 w-11 text-red-400" />
            <h1 className="text-xl font-black text-white">Status gagal dimuat</h1>
            <p className="text-sm text-red-300">{error}</p>
          </>
        ) : isPaid ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <h1 className="text-2xl font-black text-white">Pembayaran disetujui</h1>
            <p className="text-sm text-slate-400">Nexora PRO sudah aktif di akun kamu selama 30 hari.</p>
          </>
        ) : isRejected ? (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h1 className="text-2xl font-black text-white">Bukti transfer ditolak</h1>
            <p className="text-sm text-slate-400">
              {payment?.reviewNote ||
                'Bukti transfer belum dapat diverifikasi. Buat pembayaran baru dari halaman harga.'}
            </p>
          </>
        ) : isReview ? (
          <>
            <Clock3 className="mx-auto h-12 w-12 text-amber-400" />
            <h1 className="text-2xl font-black text-white">Menunggu verifikasi admin</h1>
            <p className="text-sm leading-relaxed text-slate-400">
              Bukti transfer sudah diterima. PRO akan aktif setelah pembayaran diperiksa dan disetujui.
            </p>
          </>
        ) : (
          <>
            <Clock3 className="mx-auto h-12 w-12 text-slate-400" />
            <h1 className="text-2xl font-black text-white">Pembayaran belum dikirim</h1>
            <p className="text-sm text-slate-400">
              Selesaikan transfer dan unggah bukti pembayaran dari halaman harga.
            </p>
          </>
        )}

        {payment && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Order ID</p>
            <p className="mt-1 break-all font-mono text-xs text-slate-300">{payment.orderId}</p>
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
          href={isRejected || !orderId ? '/pricing' : '/'}
          className="block w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500"
        >
          {isRejected || !orderId ? 'Kembali ke Pembayaran' : 'Kembali ke Nexora'}
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

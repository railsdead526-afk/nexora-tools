'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Loader2,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';

type MidtransOrder = {
  orderId: string;
  amount: number;
  status: string;
  checkout?: {
    token?: string;
    redirectUrl?: string;
  } | null;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CheckoutModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, session, isPro } = useUser();

  const [order, setOrder] = useState<MidtransOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const createOrder = async () => {
    if (!session?.access_token) {
      setError('Sesi login tidak ditemukan. Silakan login ulang.');
      return;
    }

    setLoadingOrder(true);
    setError('');

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || 'Gagal membuat pembayaran Midtrans.',
        );
      }

      const nextOrder: MidtransOrder = {
        orderId: data.orderId,
        amount: data.amount,
        status: data.status,
        checkout: data.checkout,
      };

      setOrder(nextOrder);

      const redirectUrl = nextOrder.checkout?.redirectUrl;
      if (!redirectUrl) {
        throw new Error('Link checkout Midtrans tidak tersedia.');
      }

      window.location.assign(redirectUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal membuat pembayaran Midtrans.',
      );
    } finally {
      setLoadingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative my-6 w-full max-w-md space-y-5 rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-slate-800/60 p-2 text-slate-400 hover:text-white"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-2 text-center">
          <div className="inline-flex rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400">
            <Crown className="h-6 w-6" />
          </div>

          <h2 className="text-xl font-black text-white">Nexora PRO</h2>

          <p className="text-3xl font-black text-white">
            Rp49.000{' '}
            <span className="text-xs font-medium text-slate-400">
              / 30 hari
            </span>
          </p>
        </div>

        {isPro ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-xs font-semibold text-emerald-300">
            Akun kamu sudah aktif sebagai PRO.
          </div>
        ) : !user ? (
          <div className="space-y-3">
            <p className="text-center text-xs text-slate-300">
              Login diperlukan agar pembayaran terhubung ke akun kamu.
            </p>

            <Link
              href="/login"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500"
            >
              Masuk / Daftar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-start gap-3">
                <WalletCards className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
                <div>
                  <p className="text-xs font-bold text-white">
                    Pembayaran aman via Midtrans
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    Kamu akan diarahkan ke halaman checkout Midtrans untuk memilih metode pembayaran.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-white">
                    Aktivasi otomatis
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    PRO aktif setelah pembayaran berhasil diverifikasi oleh Midtrans.
                  </p>
                </div>
              </div>
            </div>

            {order && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">
                      Order siap
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {order.orderId} • {formatRupiah(order.amount)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={createOrder}
              disabled={loadingOrder}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 py-3.5 text-xs font-black text-slate-950 disabled:opacity-60"
            >
              {loadingOrder ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <WalletCards className="h-4 w-4" />
              )}

              {loadingOrder ? 'Menyiapkan checkout...' : 'Lanjut Pembayaran'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

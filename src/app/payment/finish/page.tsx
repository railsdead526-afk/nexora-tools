'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import { useUser } from '@/context/UserContext';

export default function PaymentFinishPage() {
  const { isPro, refreshStatus } = useUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let attempts = 0;
    let cancelled = false;

    const check = async () => {
      attempts += 1;
      await refreshStatus();
      if (!cancelled && attempts < 8) setTimeout(check, 2500);
      else if (!cancelled) setChecking(false);
    };

    void check();
    return () => { cancelled = true; };
  }, [refreshStatus]);

  useEffect(() => {
    if (isPro) setChecking(false);
  }, [isPro]);

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl space-y-5">
        {isPro ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h1 className="text-2xl font-black text-white">Pembayaran terverifikasi</h1>
            <p className="text-sm text-slate-400">Nexora PRO sudah aktif di akun kamu.</p>
          </>
        ) : (
          <>
            {checking ? <RefreshCw className="w-10 h-10 text-amber-400 mx-auto animate-spin" /> : <Clock3 className="w-10 h-10 text-amber-400 mx-auto" />}
            <h1 className="text-2xl font-black text-white">Menunggu konfirmasi pembayaran</h1>
            <p className="text-sm text-slate-400">Status akun diperbarui dari webhook pembayaran. Jika transaksi baru selesai, konfirmasi bisa membutuhkan beberapa detik.</p>
            {!checking && (
              <button onClick={() => { setChecking(true); void refreshStatus().finally(() => setChecking(false)); }} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white">
                Cek Lagi
              </button>
            )}
          </>
        )}
        <Link href="/" className="block w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white">Kembali ke Nexora</Link>
      </div>
    </div>
  );
}

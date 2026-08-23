import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function AdminPaymentsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-center">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke Nexora
      </Link>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl">
        <div className="mx-auto mb-4 inline-flex rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h1 className="text-2xl font-black text-white">
          Review pembayaran manual sudah dinonaktifkan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Nexora sekarang memakai Midtrans sebagai satu-satunya alur pembayaran
          PRO. Aktivasi membership dilakukan otomatis melalui webhook dan
          rekonsiliasi status transaksi.
        </p>
      </div>
    </div>
  );
}

'use client';

import AdSlot from '@/components/AdSlot';

import Link from 'next/link';
import { ArrowLeft, Construction, Clock3, ShieldCheck } from 'lucide-react';

export default function VideoDownloaderMaintenancePage() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <AdSlot className="mb-6" />
      <div className="w-full max-w-xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Katalog
        </Link>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 md:p-9 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
            <Construction className="h-8 w-8 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
            <Clock3 className="h-3.5 w-3.5" />
            Maintenance
          </div>

          <h1 className="mt-5 text-2xl md:text-3xl font-black text-white">
            Video Downloader Sedang Diperbaiki
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Kami sedang meningkatkan stabilitas dan kompatibilitas Video Downloader.
            Fitur ini akan tersedia kembali setelah seluruh proses pengujian selesai.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-xs text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Tidak ada kuota yang digunakan selama fitur berada dalam maintenance.
          </div>

          <Link
            href="/"
            className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-slate-950 transition hover:bg-slate-200"
          >
            Gunakan Tools Lain
          </Link>
        </section>
      </div>
    </main>
  );
}

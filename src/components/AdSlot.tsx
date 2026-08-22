'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Megaphone } from 'lucide-react';

const ADSENSE_CLIENT = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '').trim();

/**
 * AdSlot — slot iklan untuk monetisasi trafik gratis.
 *
 * - Jika `NEXT_PUBLIC_ADSENSE_CLIENT` diisi (contoh: ca-pub-xxxxxxxx), slot
 *   memuat iklan Google AdSense asli.
 * - Jika belum diisi, ditampilkan placeholder rapi bertanda "Iklan" sehingga
 *   layout sudah siap tanpa merusak tampilan.
 * - Anggota PRO tidak melihat iklan sama sekali (benefit "bebas iklan").
 */
export default function AdSlot({
  slot,
  format = 'auto',
  className = '',
}: {
  slot?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}) {
  const { isPro, loading } = useUser();

  useEffect(() => {
    if (!ADSENSE_CLIENT || isPro || loading) return;
    try {
      // @ts-expect-error adsbygoogle didefinisikan oleh skrip AdSense
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // abaikan — iklan gagal dimuat, placeholder layout tetap tampil
    }
  }, [isPro, loading]);

  if (loading || isPro) return null;

  if (!ADSENSE_CLIENT) {
    return (
      <div
        className={`flex min-h-24 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] text-zinc-700 ${className}`}
        aria-hidden="true"
      >
        <Megaphone className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Iklan</span>
      </div>
    );
  }

  return (
    <div className={`mx-auto w-full overflow-hidden ${className}`}>
      <Script
        id="adsense-init"
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        crossOrigin="anonymous"
      />
      <ins
        className="block adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot || 'xxxxxxxxxx'}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import CheckoutModal from '@/components/CheckoutModal';
import { 
  ArrowLeft, Crown, Sparkles, Copy, Check, 
  ShoppingBag, Flame, RefreshCw, MessageSquare, 
  BookOpen, Hash, Sliders, ShieldCheck 
} from 'lucide-react';

interface GeneratedScript {
  id: number;
  title: string;
  type: string;
  hook3s: string;
  bodyScript: string;
  callToAction: string;
  caption: string;
  hashtags: string;
}

export default function AiCopywriterPage() {
  const { isPro } = useUser();
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<'affiliate' | 'edukasi' | 'viral'>('affiliate');
  const [tone, setTone] = useState<'santai' | 'dramatis' | 'clickbait'>('santai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scripts, setScripts] = useState<GeneratedScript[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Silakan ketik nama produk atau topik konten terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    setScripts([]);

    setTimeout(() => {
      setIsGenerating(false);
      const cleanTopic = topic.trim();

      setScripts([
        {
          id: 1,
          title: `Variasi 1: Formula Problem-Solution (${cleanTopic})`,
          type: 'High-Conversion Affiliate',
          hook3s: `🚨 "Stop buang duit buat yang mahal, kalau ternyata ${cleanTopic} seharga puluhan ribu ini hasilnya jauh lebih gila!"`,
          bodyScript: `Gue udah coba berbagai macam produk, tapi baru kali ini nemu yang beneran bikin kaget pas pertama kali coba. Fiturnya lengkap, build quality-nya solid, dan yang paling penting: gak bikin kantong bolong sama sekali.`,
          callToAction: `👉 "Yang mau dapetin diskon dan gratis ongkir hari ini, langsung klik keranjang kuning di pojok kiri bawah sebelum kehabisan!"`,
          caption: `Review jujur ${cleanTopic} yang lagi viral banget! Wajib punya sebelum promonya hangus 🔥`,
          hashtags: `#racuntiktok #affiliate #spillproduk #tiktokshop #${cleanTopic.toLowerCase().replace(/\s+/g, '')} #fyp`,
        },
        {
          id: 2,
          title: `Variasi 2: Formula Storytelling Emosional (${cleanTopic})`,
          type: 'Viral Retensi Views',
          hook3s: `👀 "Ternyata ini alasan kenapa orang-orang pada borong ${cleanTopic} minggu ini..."`,
          bodyScript: `Awalnya gue mikir ini cuma gimmick marketing biasa. Tapi setelah gue buktiin sendiri selama seminggu, perubahannya kerasa banget. Buat kalian yang punya masalah sama kayak gue kemarin, ini penyelamat banget sih.`,
          callToAction: `📌 "Cek keranjang kuning sekarang mumpung stok masih ready dan ada voucher potongan harga!"`,
          caption: `Gak nyangka ${cleanTopic} ini beneran sebagus itu 😭 Jangan lupa save video ini biar gak lupa!`,
          hashtags: `#viral #reviewjujur #racuntiktokshop #tipsbermanfaat #fypシ #${cleanTopic.toLowerCase().replace(/\s+/g, '')}`,
        },
        {
          id: 3,
          title: `Variasi 3: Formula Clickbait & Kontroversial (${cleanTopic})`,
          type: 'Viral Engagement',
          hook3s: `😱 "Jangan tonton video ini kalau kamu gak mau nyesel udah beli ${cleanTopic} kemahalan di tempat lain!"`,
          bodyScript: `Banyak yang belum tahu kalau barang sebagus ini harganya udah anjlok banget sekarang. Padahal kualitas bahan dan fungsinya sama persis kayak brand jutaan.`,
          callToAction: `⚡ "Klik keranjang kuning di bawah sekarang juga sebelum flash sale-nya berakhir!"`,
          caption: `Rahasia dapetin ${cleanTopic} dengan harga paling miring! Cek keranjang kuning sekarang 🔥`,
          hashtags: `#flashsale #diskonbesar #racunbelanja #affiliatemarketing #trending #fyp`,
        },
      ]);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-28 space-y-7">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
      </Link>

      {/* Header Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-sm">
          <Crown className="w-3.5 h-3.5" /> Nexora AI Copywriter Studio (PRO)
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">AI TikTok & Affiliate Hook Studio</h1>
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-2xl">
          Hasilkan naskah video 30 detik viral, <strong>Hook 3 Detik Clickbait</strong>, dan <strong>Caption Jualan Keranjang Kuning</strong> otomatis bertenaga AI.
        </p>

        {isPro && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Mode PRO Aktif: Unlimited Generate Naskah Viral
          </div>
        )}
      </div>

      {/* Form Input Generator */}
      <form onSubmit={handleGenerateContent} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-amber-400" /> Nama Produk / Topik Konten:
          </label>
          <input
            type="text"
            required
            placeholder="contoh: TWS Bluetooth Murah / Serum Pencerah Wajah / Sepatu Lari Ringan"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs md:text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Pilihan Tipe Konten & Nada Bicara */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Tipe Konten:
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setContentType('affiliate')}
                className={`p-2.5 rounded-xl border font-bold transition-all ${
                  contentType === 'affiliate' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                🛍️ Jualan
              </button>
              <button
                type="button"
                onClick={() => setContentType('edukasi')}
                className={`p-2.5 rounded-xl border font-bold transition-all ${
                  contentType === 'edukasi' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                📚 Edukasi
              </button>
              <button
                type="button"
                onClick={() => setContentType('viral')}
                className={`p-2.5 rounded-xl border font-bold transition-all ${
                  contentType === 'viral' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                🔥 Clickbait
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Nada Bicara:
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTone('santai')}
                className={`p-2.5 rounded-xl border font-bold transition-all ${
                  tone === 'santai' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Santai / Gaul
              </button>
              <button
                type="button"
                onClick={() => setTone('dramatis')}
                className={`p-2.5 rounded-xl border font-bold transition-all ${
                  tone === 'dramatis' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Dramatis
              </button>
              <button
                type="button"
                onClick={() => setTone('clickbait')}
                className={`p-2.5 rounded-xl border font-bold transition-all ${
                  tone === 'clickbait' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Bikin Penasaran
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isGenerating || !topic}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 font-black text-sm text-slate-950 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>AI Sedang Menyusun Naskah & Hook Viral...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>⚡ Generate 3 Naskah Video & Hook Viral</span>
            </>
          )}
        </button>
      </form>

      {/* Hasil 3 Naskah Video Siap Posting */}
      {scripts.length > 0 && (
        <div className="space-y-6 pt-2">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" /> Hasil AI: 3 Naskah Konten Siap Rekam
            </h2>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Formula: {contentType.toUpperCase()}
            </span>
          </div>

          <div className="space-y-6">
            {scripts.map((script) => (
              <div
                key={script.id}
                className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-5"
              >
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> {script.title}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {script.type}
                  </span>
                </div>

                {/* 1. Hook 3 Detik */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" /> 1. HOOK 3 DETIK PERTAMA (Bikin Berhenti Scroll):
                    </span>
                    <button
                      onClick={() => handleCopy(script.hook3s, `hook_${script.id}`)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedKey === `hook_${script.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === `hook_${script.id}` ? 'Tersalin' : 'Salin Hook'}
                    </button>
                  </div>
                  <p className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200 font-semibold leading-relaxed">
                    {script.hook3s}
                  </p>
                </div>

                {/* 2. Naskah Isi */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> 2. NASKAH UTAMA (Isi Video / Story):
                    </span>
                    <button
                      onClick={() => handleCopy(script.bodyScript, `body_${script.id}`)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedKey === `body_${script.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === `body_${script.id}` ? 'Tersalin' : 'Salin Naskah'}
                    </button>
                  </div>
                  <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    {script.bodyScript}
                  </p>
                </div>

                {/* 3. CTA Jualan */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5" /> 3. CALL TO ACTION (Ajakan Beli / Keranjang Kuning):
                    </span>
                    <button
                      onClick={() => handleCopy(script.callToAction, `cta_${script.id}`)}
                      className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedKey === `cta_${script.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedKey === `cta_${script.id}` ? 'Tersalin' : 'Salin CTA'}
                    </button>
                  </div>
                  <p className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold leading-relaxed">
                    {script.callToAction}
                  </p>
                </div>

                {/* Caption & Hashtag */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-indigo-400" /> Caption & Hashtag FYP:
                    </span>
                    <button
                      onClick={() => handleCopy(`${script.caption}\n\n${script.hashtags}`, `all_${script.id}`)}
                      className="text-xs font-black text-amber-400 hover:underline flex items-center gap-1"
                    >
                      {copiedKey === `all_${script.id}` ? '✓ Semua Tersalin' : 'Salin Seluruh Konten'}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                    <p className="text-slate-200">{script.caption}</p>
                    <p className="text-indigo-400 text-[11px] font-mono">{script.hashtags}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TOOLS_DATA } from '@/config/tools';
import { Search, ArrowRight, Sparkles, Video, PenTool, Mail, KeyRound, FileStack, ImageDown, Files, QrCode, CaseSensitive, Download } from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => setMounted(true), []);
  const categories = ['All', 'Video', 'Text', 'PDF', 'Image', 'Generator'];
  const filteredTools = TOOLS_DATA.filter(tool => {
    const q = search.toLowerCase();
    return (tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q)) && (selectedCategory === 'All' || tool.category === selectedCategory);
  });

  const renderToolIcon = (iconName: string) => {
    const props = { className: 'h-5 w-5 text-orange-400' };
    switch (iconName) {
      case 'pen': return <PenTool {...props} />;
      case 'download-video': return <Download {...props} />;
      case 'pdf-img': return <FileStack {...props} />;
      case 'gmail': return <Mail {...props} />;
      case 'key': return <KeyRound {...props} />;
      case 'compress': return <ImageDown {...props} />;
      case 'bg-remove': return <Sparkles {...props} />;
      case 'merge': return <Files {...props} />;
      case 'qr': return <QrCode {...props} />;
      case 'case': return <CaseSensitive {...props} />;
      case 'video': return <Video {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  if (!mounted) return <div className="flex min-h-screen items-center justify-center bg-[#050505]"><div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" /></div>;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] pb-20 text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-orange-500/[0.07] blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 -z-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14 md:pt-16">
        <section className="mx-auto max-w-3xl space-y-5 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/15 bg-orange-500/[0.06] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Nexora Online Utilities
          </div>
          <h1 className="text-3xl font-black leading-[1.08] tracking-[-0.04em] text-white sm:text-4xl md:text-5xl lg:text-6xl">
            Semua tools yang kamu butuhkan,{' '}
            <span className="block bg-gradient-to-r from-orange-300 via-orange-500 to-amber-300 bg-clip-text text-transparent">dalam satu tempat.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xs leading-6 text-zinc-400 sm:text-sm md:text-base">Tools praktis untuk dokumen, gambar, teks, video, QR, dan kebutuhan kreator. Cepat, ringan, dan dirancang untuk workflow modern.</p>

          <div className="relative mx-auto max-w-2xl pt-1">
            <Search className="pointer-events-none absolute left-4 top-[18px] h-4 w-4 text-zinc-600" />
            <input type="text" placeholder="Cari tool..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-2xl border border-white/[0.08] bg-[#0b0b0b]/95 py-3.5 pl-11 pr-4 text-xs text-white shadow-2xl shadow-black/30 outline-none transition focus:border-orange-500/35 focus:ring-4 focus:ring-orange-500/[0.06] sm:text-sm" />
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 pt-1 sm:gap-2">
            {categories.map(cat => <button key={cat} type="button" onClick={() => setSelectedCategory(cat)} className={`rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all sm:text-xs ${selectedCategory === cat ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/15' : 'border border-white/[0.07] bg-white/[0.025] text-zinc-500 hover:border-orange-500/20 hover:text-orange-300'}`}>{cat}</button>)}
          </div>
        </section>

        <section className="mt-10 sm:mt-12">
          <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-500/70">Tool library</p><h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">Pilih tool</h2></div><span className="text-[10px] text-zinc-600 sm:text-xs">{filteredTools.length} tools</span></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-5">
            {filteredTools.map(tool => <Link key={tool.id} href={`/tools/${tool.slug}`} className="group flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/25 hover:bg-orange-500/[0.025] sm:rounded-3xl sm:p-5">
              <div className="space-y-3"><div className="flex items-start justify-between gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/10 bg-orange-500/[0.05] shadow-inner transition-transform group-hover:scale-105">{renderToolIcon(tool.iconName)}</div>{tool.isPremium ? <span className="rounded-md border border-orange-500/15 bg-orange-500/10 px-2 py-0.5 text-[9px] font-black text-orange-300">★ PRO</span> : <span className="rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold text-zinc-500">{tool.badge || 'FREE'}</span>}</div><div><h3 className="line-clamp-1 text-xs font-bold text-zinc-100 transition-colors group-hover:text-orange-300 sm:text-sm">{tool.name}</h3><p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-zinc-500 sm:text-xs">{tool.description}</p></div></div>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-[10px] font-bold text-orange-400 sm:text-[11px]"><span>Buka</span><ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></div>
            </Link>)}
          </div>
          {filteredTools.length === 0 && <div className="rounded-2xl border border-dashed border-white/[0.08] py-14 text-center text-xs text-zinc-600">Tidak ada tool yang cocok dengan pencarian.</div>}
        </section>
      </div>
    </div>
  );
}

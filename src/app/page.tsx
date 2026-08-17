'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TOOLS_DATA } from '@/config/tools';
import { 
  Search, ArrowRight, Sparkles, 
  Video, PenTool, Mail, KeyRound, FileStack, ImageDown, 
  Files, QrCode, CaseSensitive, Download 
} from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = ['All', 'Video', 'Text', 'PDF', 'Image', 'Generator'];

  const filteredTools = TOOLS_DATA.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
                          tool.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'pen':
        return <PenTool className="w-5 h-5 text-orange-400" />;
      case 'download-video':
        return <Download className="w-5 h-5 text-red-400" />;
      case 'pdf-img':
        return <FileStack className="w-5 h-5 text-indigo-400" />;
      case 'gmail':
        return <Mail className="w-5 h-5 text-pink-400" />;
      case 'key':
        return <KeyRound className="w-5 h-5 text-yellow-400" />;
      case 'compress':
        return <ImageDown className="w-5 h-5 text-blue-400" />;
      case 'merge':
        return <Files className="w-5 h-5 text-emerald-400" />;
      case 'qr':
        return <QrCode className="w-5 h-5 text-purple-400" />;
      case 'case':
        return <CaseSensitive className="w-5 h-5 text-cyan-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-slate-400" />;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden pb-20 min-h-screen bg-slate-950">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[280px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-amber-500/10 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 pt-8 md:pt-16 space-y-8 md:space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Nexora Online Utilities
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Kumpulan Tools Serbaguna <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
              Cepat, Ringan & Siap Pakai
            </span>
          </h1>

          <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-lg mx-auto">
            Tools gratis langsung jalan di browser tanpa upload server, plus tools kreator bertenaga AI.
          </p>

          {/* Search Box */}
          <div className="relative pt-2">
            <Search className="absolute left-4 top-5.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari tool... (contoh: download video, pdf, gmail, qr)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-2xl focus:outline-none text-xs md:text-sm text-white placeholder-slate-500 shadow-xl transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] md:text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* GRID 2 KOLOM DI HP */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {filteredTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="p-3.5 sm:p-5 rounded-2xl md:rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-200 flex flex-col justify-between group shadow-lg hover:-translate-y-0.5"
            >
              <div className="space-y-2.5">
                {/* Baris Atas */}
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    {renderToolIcon(tool.iconName)}
                  </div>

                  {tool.isPremium ? (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-sm">
                      ★ PRO
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/40">
                      {tool.badge || 'FREE'}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {tool.name}
                  </h3>
                  <p className="text-slate-400 text-[10px] sm:text-xs leading-relaxed mt-1 line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-bold text-indigo-400 group-hover:text-indigo-300">
                <span>Buka</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

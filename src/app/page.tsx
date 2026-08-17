'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TOOLS_DATA } from '@/config/tools';
import { 
  LayoutGrid, Download, Wand2, Wrench, FileText, 
  ArrowRight, Sparkles, Video, PenTool, Mail, 
  KeyRound, FileStack, ImageDown, Files, QrCode, 
  CaseSensitive, Search 
} from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = [
    { name: 'All', icon: LayoutGrid },
    { name: 'Downloader', icon: Download },
    { name: 'Maker', icon: Wand2 },
    { name: 'Dokumen', icon: FileText },
    { name: 'Tools', icon: Wrench },
  ];

  const filteredTools = TOOLS_DATA.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
                          tool.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const renderToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'download-video':
        return <Download className="w-6 h-6 text-pink-400" />;
      case 'pen':
        return <PenTool className="w-6 h-6 text-purple-400" />;
      case 'pdf-img':
        return <FileStack className="w-6 h-6 text-indigo-400" />;
      case 'gmail':
        return <Mail className="w-6 h-6 text-red-400" />;
      case 'key':
        return <KeyRound className="w-6 h-6 text-yellow-400" />;
      case 'compress':
        return <ImageDown className="w-6 h-6 text-blue-400" />;
      case 'merge':
        return <Files className="w-6 h-6 text-emerald-400" />;
      case 'qr':
        return <QrCode className="w-6 h-6 text-violet-400" />;
      case 'case':
        return <CaseSensitive className="w-6 h-6 text-cyan-400" />;
      default:
        return <Sparkles className="w-6 h-6 text-purple-400" />;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#080415] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080415] text-slate-100 pb-24 selection:bg-purple-500 selection:text-white">
      {/* Ambient Neon Purple Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-purple-900/25 via-indigo-900/15 to-transparent blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 pt-6 space-y-6">
        {/* Search Bar Ramping */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-purple-400/60" />
          <input
            type="text"
            placeholder="Cari tool serbaguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#120826]/90 border border-purple-900/40 focus:border-purple-500 rounded-2xl focus:outline-none text-xs text-white placeholder-purple-300/40 shadow-xl transition-all"
          />
        </div>

        {/* Tab Filter Kategori (Pill Buttons seperti di Screenshot) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-[#140a2b]/80 border border-purple-900/40 text-purple-200/70 hover:text-white hover:border-purple-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Section Header dengan Garis Horizontal */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm font-black tracking-wider text-purple-200 uppercase font-mono">
            <LayoutGrid className="w-4 h-4 text-purple-400" />
            <span>Semua Tools</span>
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-purple-900/80 to-transparent" />
        </div>

        {/* GRID 3 KOLOM DI HP PERSIS SEPERTI DI SCREENSHOT */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {filteredTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="p-3 sm:p-4 rounded-2xl bg-[#110826]/80 border border-purple-900/40 hover:border-purple-500/60 transition-all duration-200 flex flex-col justify-between items-center text-center group shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
            >
              {/* Ikon di Atas Tengah */}
              <div className="w-10 h-10 rounded-xl bg-[#1a0c3b]/80 border border-purple-900/50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform mb-2">
                {renderToolIcon(tool.iconName)}
              </div>

              {/* Judul & Deskripsi */}
              <div className="space-y-1 w-full">
                <h3 className="font-bold text-[11px] sm:text-xs text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                  {tool.name}
                </h3>
                <p className="text-purple-300/50 text-[9px] sm:text-[10px] leading-tight line-clamp-2">
                  {tool.description}
                </p>
              </div>

              {/* Badge & Tanda Panah */}
              <div className="w-full pt-2.5 flex flex-col items-center gap-1.5">
                <span className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full border tracking-wide uppercase ${
                  tool.badge === 'PRO'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-purple-950/60 text-purple-300 border-purple-800/50'
                }`}>
                  {tool.badge}
                </span>

                <ArrowRight className="w-3.5 h-3.5 text-purple-400/60 group-hover:text-purple-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

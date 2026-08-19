'use client';

import { ArrowUp, Bot, Code2, FolderKanban, History, Image as ImageIcon, Menu, MessageSquare, Plus, Sparkles, Wrench, X, Crown, LayoutGrid, Bug, LogIn, Settings, UserCircle, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const suggestions = [
  { icon: Code2, title: 'Build a web app', text: 'Buat aplikasi web dari ide saya.' },
  { icon: Wrench, title: 'Fix my code', text: 'Cari dan perbaiki error project saya.' },
  { icon: FolderKanban, title: 'Analyze project', text: 'Analisis struktur project saya.' },
  { icon: ImageIcon, title: 'Work with files', text: 'Olah gambar, PDF, atau file.' },
];

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  if (!open) return null;
  return <>
    <button type="button" onClick={close} className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px]" aria-label="Tutup menu" />
    <aside className="fixed inset-y-0 left-0 z-[70] flex w-[min(340px,88vw)] flex-col border-r border-white/[0.07] bg-[#070707]/96 shadow-2xl shadow-black/70 backdrop-blur-2xl">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-4"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c65a16] text-black shadow-lg shadow-orange-950/30"><Sparkles className="h-4 w-4" /></div><span className="text-sm font-black tracking-tight">NexoraTools</span></div><button type="button" onClick={close} className="rounded-xl p-2 text-zinc-500 transition hover:bg-white/[0.04] hover:text-white" aria-label="Tutup menu"><X className="h-4 w-4" /></button></div>
      <nav className="flex-1 overflow-y-auto p-3"><div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">Workspace</div>
        <Link href="/" onClick={close} className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"><LayoutGrid className="h-4 w-4 text-[#c65a16]" /> Semua Tools</Link>
        <Link href="/nexora-ai" onClick={close} className="mb-1 flex items-center gap-3 rounded-xl border border-[#c65a16]/20 bg-[#c65a16]/[0.07] px-3 py-2.5 text-xs font-bold text-[#e06b1f]"><Sparkles className="h-4 w-4" /> NexoraAI <span className="ml-auto rounded-md bg-[#c65a16]/10 px-1.5 py-0.5 text-[8px] uppercase tracking-wider">AI</span></Link>
        <Link href="/pricing" onClick={close} className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"><Crown className="h-4 w-4 text-[#8b6ccf]" /> Nexora Pro</Link>
        <div className="my-4 h-px bg-white/[0.06]" />
        <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">Bantuan</div>
        <Link href="/help" onClick={close} className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"><HelpCircle className="h-4 w-4" /> Bantuan</Link>
        <Link href="/feedback" onClick={close} className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"><Bug className="h-4 w-4" /> Lapor Bug / Saran</Link>
      </nav>
      <div className="border-t border-white/[0.06] p-3"><div className="grid grid-cols-3 gap-1"><Link href="/profile" onClick={close} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-semibold text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"><UserCircle className="h-4 w-4" />Profil</Link><Link href="/settings" onClick={close} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-semibold text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"><Settings className="h-4 w-4" />Pengaturan</Link><Link href="/login" onClick={close} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-semibold text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"><LogIn className="h-4 w-4" />Masuk</Link></div></div>
    </aside>
  </>;
}

export default function NexoraAIHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const openChat = (text = '') => { window.location.href = `/nexora-ai/chat${text ? `?prompt=${encodeURIComponent(text)}` : ''}`; };
  return <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#050505] text-white selection:bg-orange-500/20">
    <style jsx>{`@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes pulseGlow{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.45;transform:scale(1.03)}}.rise{animation:rise .55s cubic-bezier(.22,1,.36,1) both}.glow{animation:pulseGlow 6s ease-in-out infinite}.press-glow{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background-color .18s ease}.press-glow:hover{border-color:rgba(198,90,22,.22)}.press-glow:active{transform:scale(.97)}@media(prefers-reduced-motion:reduce){.rise,.glow{animation:none!important}.press-glow{transition:none!important}}`}</style>
    <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="glow absolute left-1/2 top-[-240px] h-[540px] w-[780px] -translate-x-1/2 rounded-full bg-[#c65a16]/[0.06] blur-[130px]" /></div>
    <button type="button" onClick={() => setMenuOpen(true)} className="press-glow fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/50 text-zinc-400 shadow-xl shadow-black/20 backdrop-blur-xl hover:text-white" aria-label="Buka menu NexoraTools"><Menu className="h-5 w-5" /></button>
    <Sidebar open={menuOpen} close={() => setMenuOpen(false)} />
    <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="rise mx-auto mb-8 max-w-3xl text-center"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c65a16]/15 bg-[#c65a16]/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#e06b1f]/80"><Sparkles className="h-3.5 w-3.5" /> NexoraTools AI Workspace</div><h1 className="text-4xl font-black tracking-[-0.045em] sm:text-6xl lg:text-7xl">Build something<span className="block bg-gradient-to-r from-white via-[#8b6ccf] to-[#c65a16] bg-clip-text text-transparent">remarkable.</span></h1><p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">AI workspace NexoraTools untuk membuat, memahami, memperbaiki, dan mengembangkan project kamu.</p></div>
      <section className="rise mx-auto w-full max-w-4xl"><div className="rounded-[30px] border border-[#c65a16]/10 bg-white/[0.035] p-2 shadow-[0_30px_100px_rgba(0,0,0,.5)] backdrop-blur-xl"><div className="rounded-[23px] border border-white/[0.06] bg-[#0a0a0a] px-3 py-3"><div className="flex items-center gap-2"><button type="button" onClick={() => openChat()} className="press-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-zinc-400 hover:text-white" aria-label="Mulai chat"><Plus className="h-5 w-5" /></button><button type="button" onClick={() => openChat()} className="press-glow min-w-0 flex-1 text-left text-sm text-zinc-600 hover:text-zinc-400 sm:text-[15px]">Tanya atau buat sesuatu...</button><button type="button" onClick={() => openChat()} className="press-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c65a16] text-black shadow-lg shadow-orange-950/30 hover:bg-[#e06b1f]" aria-label="Masuk ke chat"><ArrowUp className="h-5 w-5" /></button></div></div></div></section>
      <div className="rise mx-auto mt-5 grid w-full max-w-4xl grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">{suggestions.map(({ icon: Icon, title, text }) => <button key={title} type="button" onClick={() => openChat(text)} className="press-glow group min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 text-left shadow-sm shadow-black/20 sm:p-4"><div className="flex min-w-0 items-start gap-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#c65a16]/10 bg-[#c65a16]/[0.05]"><Icon className="h-4 w-4 text-[#c65a16]" /></div><div className="min-w-0"><p className="truncate text-[11px] font-bold text-zinc-200 sm:text-xs">{title}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-600 sm:text-[11px]">{text}</p></div></div></button>)}</div>
      <div className="mt-8 flex justify-center gap-5 text-[11px] text-zinc-600"><span className="inline-flex items-center gap-1.5"><Bot className="h-3.5 w-3.5 text-[#c65a16]/70" /> AI workspace</span><span className="inline-flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Context-aware</span></div>
    </main>
  </div>;
}

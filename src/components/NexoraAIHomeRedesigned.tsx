'use client';

import { ArrowUp, Bot, Code2, FolderKanban, Image as ImageIcon, Menu, MessageSquare, Plus, Sparkles, Wrench, X, Crown, LayoutGrid, Bug, LogIn, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import FeedbackModal from '@/components/FeedbackModal';

const suggestions = [
  { icon: Code2, title: 'Build a web app', text: 'Buat aplikasi web dari ide saya.' },
  { icon: Wrench, title: 'Fix my code', text: 'Cari dan perbaiki error project saya.' },
  { icon: FolderKanban, title: 'Analyze project', text: 'Analisis struktur project saya.' },
  { icon: ImageIcon, title: 'Work with files', text: 'Olah gambar, PDF, atau file.' },
];

function Sidebar({ open, close, openFeedback }: { open: boolean; close: () => void; openFeedback: () => void }) {
  if (!open) return null;
  const item = 'mb-1 flex min-h-12 items-center gap-3 rounded-2xl px-3.5 py-3 text-[14px] font-semibold transition hover:bg-white/[0.045] hover:text-zinc-100';
  return <>
    <button type="button" onClick={close} className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]" aria-label="Tutup menu" />
    <aside className="fixed inset-y-0 left-0 z-[70] flex w-[min(360px,78vw)] flex-col border-r border-white/[0.07] bg-[#070707]/98 shadow-2xl shadow-black/70 backdrop-blur-2xl">
      <div className="flex h-[82px] shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
        <Link href="/" onClick={close} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c65a16] text-black shadow-lg shadow-orange-950/30"><Sparkles className="h-5 w-5" /></div>
          <span className="text-[20px] font-black tracking-[0.06em] text-zinc-100">NEXORA<span className="text-[#c65a16]">.</span></span>
        </Link>
        <button type="button" onClick={close} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 text-zinc-400 transition hover:border-white/[0.14] hover:text-zinc-100" aria-label="Tutup menu"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <Link href="/" onClick={close} className={`${item} text-zinc-300`}><LayoutGrid className="h-5 w-5 text-[#c65a16]" />Semua Tools</Link>
        <Link href="/nexora-ai" onClick={close} className={`${item} border border-[#c65a16]/20 bg-[#c65a16]/[0.08] font-bold text-[#d66a25] shadow-[0_8px_30px_rgba(198,90,22,.06)]`}><Bot className="h-5 w-5" />NexoraAI<span className="ml-auto rounded-lg bg-[#c65a16]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#d66a25]">AI</span></Link>
        <Link href="/pricing" onClick={close} className={`${item} text-zinc-300`}><Crown className="h-5 w-5 text-[#9b7bdd]" />Nexora Pro</Link>
        <div className="my-5 h-px bg-white/[0.07]" />
        <button type="button" onClick={() => { close(); openFeedback(); }} className={`${item} w-full text-left text-zinc-400`}><Bug className="h-5 w-5 text-[#c65a16]" />Lapor Bug &amp; Saran</button>
      </nav>
      <div className="border-t border-white/[0.07] p-4">
        <Link href="/profile" onClick={close} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/[0.045]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c65a16] text-sm font-bold text-black">N</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-zinc-200">Profil</p><p className="text-[11px] text-zinc-600">Kelola akun kamu</p></div>
          <User className="h-4 w-4 text-zinc-600" />
        </Link>
        <Link href="/login" onClick={close} className="mt-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[12px] font-semibold text-zinc-500 transition hover:bg-white/[0.045] hover:text-zinc-200"><LogIn className="h-4 w-4" />Masuk / Daftar</Link>
      </div>
    </aside>
  </>;
}

export default function NexoraAIHomeRedesigned() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const openChat = (text = '') => { window.location.href = `/nexora-ai/chat${text ? `?prompt=${encodeURIComponent(text)}` : ''}`; };
  return <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[#050505] text-[#f4f4f5] selection:bg-[#c65a16]/20">
    <style jsx>{`@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes pulseGlow{0%,100%{opacity:.22;transform:scale(1)}50%{opacity:.4;transform:scale(1.03)}}@keyframes titleShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}.rise{animation:rise .55s cubic-bezier(.22,1,.36,1) both}.glow{animation:pulseGlow 6s ease-in-out infinite}.title-gradient{background-size:200% 200%;animation:titleShift 8s ease-in-out infinite}.press-glow{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background-color .18s ease}.press-glow:hover{border-color:rgba(198,90,22,.22)}.press-glow:active{transform:scale(.97)}@media(prefers-reduced-motion:reduce){.rise,.glow,.title-gradient{animation:none!important}.press-glow{transition:none!important}}`}</style>
    <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="glow absolute left-1/2 top-[-240px] h-[540px] w-[780px] -translate-x-1/2 rounded-full bg-[#c65a16]/[0.06] blur-[130px]" /></div>
    <button type="button" onClick={() => setMenuOpen(true)} className="press-glow fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-zinc-400 transition hover:border-[#c65a16]/25 hover:text-zinc-100 md:hidden" aria-label="Buka menu NexoraTools"><Menu className="h-5 w-5" /></button>
    <Sidebar open={menuOpen} close={() => setMenuOpen(false)} openFeedback={() => setFeedbackOpen(true)} />
    <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="rise mx-auto mb-8 max-w-3xl text-center"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c65a16]/15 bg-[#c65a16]/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b85b25]/90"><Sparkles className="h-3.5 w-3.5" /> NexoraTools AI Workspace</div><h1 className="text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#f4f4f5] sm:text-6xl lg:text-7xl">Build something<span className="title-gradient block bg-gradient-to-r from-[#f4f4f5] via-[#8b6ccf] to-[#c65a16] bg-clip-text pb-1 text-transparent">remarkable.</span></h1><p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">AI workspace NexoraTools untuk membuat, memahami, memperbaiki, dan mengembangkan project kamu.</p></div>
      <section className="rise mx-auto w-full max-w-4xl"><div className="rounded-[30px] border border-[#c65a16]/10 bg-white/[0.035] p-2 shadow-[0_30px_100px_rgba(0,0,0,.5)] backdrop-blur-xl"><div className="rounded-[23px] border border-white/[0.06] bg-[#0a0a0a] px-3 py-3"><div className="flex items-center gap-2"><button type="button" onClick={() => openChat()} className="press-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-zinc-400 hover:text-zinc-100" aria-label="Mulai chat"><Plus className="h-5 w-5" /></button><button type="button" onClick={() => openChat()} className="press-glow min-w-0 flex-1 text-left text-sm text-zinc-600 hover:text-zinc-400 sm:text-[15px]">Tanya atau buat sesuatu...</button><button type="button" onClick={() => openChat()} className="press-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c65a16] text-black shadow-lg shadow-orange-950/30 hover:bg-[#d66a25]" aria-label="Masuk ke chat"><ArrowUp className="h-5 w-5" /></button></div></div></div></section>
      <div className="rise mx-auto mt-5 grid w-full max-w-4xl grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">{suggestions.map(({ icon: Icon, title, text }) => <button key={title} type="button" onClick={() => openChat(text)} className="press-glow group min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 text-left shadow-sm shadow-black/20 sm:p-4"><div className="flex min-w-0 items-start gap-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#c65a16]/10 bg-[#c65a16]/[0.05]"><Icon className="h-4 w-4 text-[#c65a16]" /></div><div className="min-w-0"><p className="truncate text-[11px] font-bold text-zinc-200 sm:text-xs">{title}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-600 sm:text-[11px]">{text}</p></div></div></button>)}</div>
      <div className="mt-8 flex justify-center gap-5 text-[11px] text-zinc-600"><span className="inline-flex items-center gap-1.5"><Bot className="h-3.5 w-3.5 text-[#c65a16]/70" /> AI workspace</span><span className="inline-flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Context-aware</span></div>
    </main>
  </div>;
}

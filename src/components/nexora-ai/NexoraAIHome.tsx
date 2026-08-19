'use client';

import { ArrowUp, Bot, Code2, FolderKanban, HelpCircle, History, Image as ImageIcon, Menu, MessageSquare, Plus, Settings, Sparkles, UserCircle, Wrench, X, Crown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const suggestions = [
  { icon: Code2, title: 'Build a web app', text: 'Buat aplikasi web dari ide saya.' },
  { icon: Wrench, title: 'Fix my code', text: 'Cari dan perbaiki error project saya.' },
  { icon: FolderKanban, title: 'Analyze project', text: 'Analisis struktur project saya.' },
  { icon: ImageIcon, title: 'Work with files', text: 'Olah gambar, PDF, atau file.' },
];

function MenuLinks({ close }: { close: () => void }) {
  return <div className="shrink-0 space-y-1 border-b border-white/[0.06] p-3">
    <Link href="/pro" onClick={close} className="press-glow flex items-center gap-3 rounded-xl border border-orange-500/15 bg-orange-500/[0.05] px-3 py-3 text-xs font-bold text-orange-300"><Crown className="h-4 w-4" /> Nexora AI Pro <span className="ml-auto text-[9px] uppercase tracking-wider text-orange-500/70">Upgrade</span></Link>
    <div className="grid grid-cols-3 gap-1">
      <Link href="/settings" onClick={close} className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-semibold text-zinc-500 hover:bg-white/[0.05] hover:text-white"><Settings className="h-4 w-4" />Pengaturan</Link>
      <Link href="/profile" onClick={close} className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-semibold text-zinc-500 hover:bg-white/[0.05] hover:text-white"><UserCircle className="h-4 w-4" />Profil</Link>
      <Link href="/help" onClick={close} className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-semibold text-zinc-500 hover:bg-white/[0.05] hover:text-white"><HelpCircle className="h-4 w-4" />Bantuan</Link>
    </div>
  </div>;
}

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  if (!open) return null;
  return <>
    <button type="button" onClick={close} className="fixed inset-0 z-[60] bg-black/45" aria-label="Tutup menu" />
    <aside className="fixed inset-y-0 left-0 z-[70] flex w-[min(320px,84vw)] flex-col border-r border-white/[0.07] bg-[#0a0a0a] shadow-2xl shadow-black/60 backdrop-blur-2xl">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] px-4"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-black"><Sparkles className="h-4 w-4" /></div><span className="text-sm font-black">Nexora AI</span></div><button type="button" onClick={close} className="press-glow rounded-xl p-2 text-zinc-500" aria-label="Tutup menu"><X className="h-4 w-4" /></button></div>
      <MenuLinks close={close} />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"><div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600"><History className="h-3.5 w-3.5" /> Riwayat chat</div><div className="rounded-xl border border-dashed border-white/[0.06] px-3 py-5 text-center text-[11px] leading-5 text-zinc-600">Belum ada riwayat tersimpan.<br />Akan aktif bersama sistem akun.</div></div>
    </aside>
  </>;
}

export default function NexoraAIHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const openChat = (text = '') => { window.location.href = `/nexora-ai/chat${text ? `?prompt=${encodeURIComponent(text)}` : ''}`; };

  return <div className="min-h-[calc(100vh-4rem)] overflow-hidden bg-[#070707] text-white">
    <style jsx>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(14px)}}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes send{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}.float{animation:float 8s ease-in-out infinite}.rise{animation:rise .6s cubic-bezier(.22,1,.36,1) both}.send{animation:send 2.8s ease-in-out infinite}.press-glow{transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,background-color .16s ease}.press-glow:active{transform:scale(.95);box-shadow:0 0 0 5px rgba(249,115,22,.12),0 0 28px rgba(249,115,22,.32)!important;border-color:rgba(249,115,22,.55)!important;background-color:rgba(249,115,22,.08)!important}@media(prefers-reduced-motion:reduce){.float,.rise,.send{animation:none!important}.press-glow{transition:none!important}}`}</style>
    <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="float absolute left-1/2 top-[-220px] h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[120px]" /><div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" /></div>
    <button type="button" onClick={() => setMenuOpen(true)} className="press-glow fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-black/40 text-zinc-400 backdrop-blur-xl" aria-label="Buka menu utama"><Menu className="h-5 w-5" /></button>
    <Sidebar open={menuOpen} close={() => setMenuOpen(false)} />
    <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="rise mx-auto mb-8 max-w-3xl text-center"><h1 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">Build something<span className="block bg-gradient-to-r from-orange-300 via-orange-500 to-amber-300 bg-clip-text text-transparent">remarkable.</span></h1><p className="mt-5 text-sm leading-7 text-zinc-400 sm:text-base">AI workspace untuk membuat, memahami, memperbaiki, dan mengembangkan project kamu.</p></div>
      <section className="rise mx-auto w-full max-w-4xl"><div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-2 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl"><div className="rounded-[23px] border border-white/[0.06] bg-[#0c0c0c] px-3 py-3"><div className="flex items-center gap-2"><button type="button" onClick={() => openChat()} className="press-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-zinc-400" aria-label="Mulai chat"><Plus className="h-5 w-5" /></button><button type="button" onClick={() => openChat()} className="press-glow min-w-0 flex-1 text-left text-sm text-zinc-600 sm:text-[15px]">Tanya atau buat sesuatu...</button><button type="button" onClick={() => openChat()} className="press-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-black shadow-lg shadow-orange-500/20" aria-label="Masuk ke chat"><ArrowUp className="h-5 w-5" /></button></div></div></div></section>
      <div className="rise mx-auto mt-5 grid w-full max-w-4xl grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">{suggestions.map(({ icon: Icon, title, text }) => <button key={title} type="button" onClick={() => openChat(text)} className="press-glow group min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 text-left sm:p-4"><div className="flex min-w-0 items-start gap-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/10 bg-orange-500/[0.05]"><Icon className="h-4 w-4 text-orange-400" /></div><div className="min-w-0"><p className="truncate text-[11px] font-bold text-zinc-200 sm:text-xs">{title}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-600 sm:text-[11px]">{text}</p></div></div></button>)}</div>
      <div className="mt-8 flex justify-center gap-5 text-[11px] text-zinc-600"><span className="inline-flex items-center gap-1.5"><Bot className="h-3.5 w-3.5 text-orange-500/70" /> AI workspace</span><span className="inline-flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Context-aware</span></div>
    </main>
  </div>;
}

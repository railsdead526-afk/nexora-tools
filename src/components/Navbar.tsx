'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import FeedbackModal from '@/components/FeedbackModal';
import { Crown, LogOut, Menu, MessageSquarePlus, Sparkles, User, X, Bot } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { user, loading, isPro, signOut } = useUser();
  const handleSignOut = async () => { await signOut(); setIsOpen(false); };
  const linkClass = 'text-sm text-zinc-400 transition-colors hover:text-[#d66a25]';
  return <>
    <nav className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#050505]/85 backdrop-blur-2xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6"><div className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c65a16] text-black shadow-lg shadow-orange-950/30"><Sparkles className="h-4 w-4" /></div><span className="text-lg font-black tracking-[0.12em] text-zinc-100">NEXORA<span className="text-[#c65a16]">.</span></span></Link>
        <div className="hidden items-center gap-6 md:flex"><Link href="/" className={linkClass}>Semua Tools</Link><Link href="/nexora-ai" className="flex items-center gap-1.5 text-sm font-bold text-[#d66a25] transition-colors hover:text-[#e08a52]"><Bot className="h-4 w-4" /> NexoraAI</Link><Link href="/pricing" className="flex items-center gap-1 text-sm font-semibold text-[#b19bdc] hover:text-[#c1afe4]"><Crown className="h-4 w-4" /> Nexora Pro</Link><button type="button" onClick={() => setIsFeedbackOpen(true)} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-100"><MessageSquarePlus className="h-3.5 w-3.5 text-[#c65a16]" /> Lapor Bug / Saran</button>
          {!loading && user ? <div className="flex items-center gap-3 border-l border-white/[0.08] pl-4"><div className="flex items-center gap-2 text-xs"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c65a16] font-bold uppercase text-black">{user.name[0] || 'U'}</div><div className="flex max-w-36 flex-col"><span className="truncate font-semibold text-zinc-200">{user.name}</span><span className={isPro ? 'text-[9px] font-black text-[#d66a25]' : 'text-[9px] text-zinc-600'}>{isPro ? '★ PRO MEMBER' : 'FREE USER'}</span></div></div><button type="button" onClick={handleSignOut} className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-red-400" aria-label="Keluar"><LogOut className="h-4 w-4" /></button></div> : !loading ? <Link href="/login" className="rounded-xl bg-[#c65a16] px-4 py-2 text-xs font-bold text-black shadow-lg shadow-orange-950/30 transition hover:bg-[#d66a25]">Masuk / Daftar</Link> : null}
        </div>
        <button type="button" onClick={() => setIsOpen(v => !v)} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2 text-zinc-400 transition hover:border-[#c65a16]/25 hover:text-zinc-100 md:hidden" aria-label="Buka menu">{isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div></div>
      {isOpen && <div className="border-t border-white/[0.06] bg-[#070707] px-4 py-4 md:hidden"><div className="space-y-3"><Link href="/" onClick={() => setIsOpen(false)} className={linkClass + ' block'}>Semua Tools</Link><Link href="/nexora-ai" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm font-bold text-[#d66a25]"><Bot className="h-4 w-4" /> NexoraAI</Link><Link href="/pricing" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm font-semibold text-[#b19bdc]"><Crown className="h-4 w-4" /> Nexora Pro</Link><button type="button" onClick={() => { setIsOpen(false); setIsFeedbackOpen(true); }} className="flex items-center gap-2 py-1 text-sm text-zinc-400"><MessageSquarePlus className="h-4 w-4 text-[#c65a16]" /> Lapor Bug & Saran</button><div className="border-t border-white/[0.07] pt-3">{!loading && user ? <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c65a16] font-bold text-black">{user.name[0] || 'U'}</div><span className="text-zinc-200">{user.name}</span></div><button type="button" onClick={handleSignOut} className="text-xs font-semibold text-red-400">Keluar</button></div> : !loading ? <Link href="/login" onClick={() => setIsOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c65a16] py-2.5 text-xs font-bold text-black"><User className="h-4 w-4" /> Masuk / Daftar Akun</Link> : null}</div></div></div>}
    </nav><FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
  </>;
}

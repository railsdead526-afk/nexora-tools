'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import FeedbackModal from '@/components/FeedbackModal';
import { Crown, LogOut, Menu, MessageSquarePlus, Sparkles, User, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { user, loading, isPro, signOut } = useUser();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-amber-400 p-[1px]">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <span className="text-lg font-black tracking-wider text-white">NEXORA<span className="text-indigo-500">.</span></span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-slate-300 hover:text-white">Semua Tools</Link>
              <Link href="/pricing" className="flex items-center gap-1 text-sm font-semibold text-amber-400 hover:text-amber-300">
                <Crown className="w-4 h-4" /> Nexora Pro
              </Link>
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(true)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-400" /> Lapor Bug / Saran
              </button>

              {!loading && user ? (
                <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white uppercase">
                      {user.name[0] || 'U'}
                    </div>
                    <div className="flex flex-col max-w-36">
                      <span className="text-slate-200 font-semibold truncate">{user.name}</span>
                      <span className={isPro ? 'text-[9px] font-black text-amber-400' : 'text-[9px] text-slate-500'}>
                        {isPro ? '★ PRO MEMBER' : 'FREE USER'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
                    aria-label="Keluar"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : !loading ? (
                <Link href="/login" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl text-white shadow-lg shadow-indigo-600/30 transition-all">
                  Masuk / Daftar
                </Link>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
              aria-label="Buka menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-3">
            <Link href="/" onClick={() => setIsOpen(false)} className="block text-sm text-slate-300 py-1">Semua Tools</Link>
            <Link href="/pricing" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm font-semibold text-amber-400 py-1">
              <Crown className="w-4 h-4" /> Nexora Pro
            </Link>
            <button
              type="button"
              onClick={() => { setIsOpen(false); setIsFeedbackOpen(true); }}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white py-1 w-full text-left"
            >
              <MessageSquarePlus className="w-4 h-4 text-indigo-400" /> Lapor Bug & Saran
            </button>

            <div className="pt-2 border-t border-slate-800">
              {!loading && user ? (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-xs min-w-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white uppercase">{user.name[0] || 'U'}</div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-slate-200 truncate">{user.name}</span>
                      <span className={isPro ? 'text-[9px] font-black text-amber-400' : 'text-[9px] text-slate-500'}>{isPro ? '★ PRO MEMBER' : 'FREE USER'}</span>
                    </div>
                  </div>
                  <button type="button" onClick={handleSignOut} className="text-xs text-red-400 font-semibold">Keluar</button>
                </div>
              ) : !loading ? (
                <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30">
                  <User className="w-4 h-4" /> Masuk / Daftar Akun
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </nav>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
}

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useUser } from '@/context/UserContext';
import FeedbackModal from '@/components/FeedbackModal';
import { 
  Sparkles, Crown, Menu, X, LogOut, 
  MessageSquarePlus, Download, User 
} from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { isPro } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

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
              <span className="text-lg font-black tracking-wider text-white">
                NEXORA<span className="text-indigo-500">.</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-slate-300 hover:text-white">
                Semua Tools
              </Link>
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

              {mounted && session ? (
                <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white uppercase">
                      {session.user?.name?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-200 font-semibold">{session.user?.name}</span>
                      {isPro ? (
                        <span className="text-[9px] font-black text-amber-400">★ PRO MEMBER</span>
                      ) : (
                        <span className="text-[9px] text-slate-500">FREE USER</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl text-white shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Masuk / Daftar
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-3">
            <Link href="/" onClick={() => setIsOpen(false)} className="block text-sm text-slate-300 py-1">
              Semua Tools
            </Link>
            <Link href="/pricing" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm font-semibold text-amber-400 py-1">
              <Crown className="w-4 h-4" /> Nexora Pro
            </Link>

            <button
              type="button"
              onClick={() => { setIsOpen(false); setIsFeedbackOpen(true); }}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white py-1 w-full text-left"
            >
              <MessageSquarePlus className="w-4 h-4 text-indigo-400" /> Lapor Bug & Saran Fitur
            </button>

            <div className="pt-2 border-t border-slate-800">
              {mounted && session ? (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white uppercase">
                      {session.user?.name?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-200">{session.user?.name}</span>
                      {isPro ? (
                        <span className="text-[9px] font-black text-amber-400">★ PRO MEMBER</span>
                      ) : (
                        <span className="text-[9px] text-slate-500">FREE USER</span>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => signOut()} className="text-xs text-red-400 font-semibold">
                    Keluar
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  <User className="w-4 h-4" /> Masuk / Daftar Akun
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
}

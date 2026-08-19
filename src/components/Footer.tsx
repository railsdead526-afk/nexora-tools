import Link from 'next/link';
import { Sparkles, Shield, Lock, Bot } from 'lucide-react';

export default function Footer() {
  return <footer className="mt-20 border-t border-white/[0.07] bg-[#070707]/90 backdrop-blur-xl"><div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
    <div className="flex flex-col items-center justify-between gap-6 md:flex-row"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-black shadow-lg shadow-orange-500/15"><Sparkles className="h-3.5 w-3.5" /></div><span className="text-base font-black tracking-[0.12em] text-white">NEXORA<span className="text-orange-500">.</span></span></div>
    <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-500"><Link href="/" className="transition hover:text-orange-400">Semua Tools</Link><Link href="/nexora-ai" className="flex items-center gap-1.5 transition hover:text-orange-400"><Bot className="h-3.5 w-3.5 text-orange-500" /> NexoraAI</Link><Link href="/pricing" className="transition hover:text-orange-400">Nexora Pro</Link><span className="text-zinc-800">|</span><span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-orange-500/70" /> Client-Side Safe</span><span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-orange-500/70" /> No Data Stored</span></div></div>
    <div className="border-t border-white/[0.06] pt-6 text-center text-xs text-zinc-700"><p>© {new Date().getFullYear()} Nexora Tools Hub. All rights reserved. Built for creators & pros.</p></div>
  </div></footer>;
}

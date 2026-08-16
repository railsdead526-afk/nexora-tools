import Link from 'next/link';
import { Sparkles, Shield, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/80 backdrop-blur-md mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-amber-400 p-[1px]">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
            <span className="text-base font-black tracking-wider text-white">
              NEXORA<span className="text-indigo-500">.</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">Semua Tools</Link>
            <Link href="/pricing" className="hover:text-amber-400 transition-colors">Nexora Pro</Link>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-emerald-400" /> 100% Client-Side Safe</span>
            <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-indigo-400" /> No Data Stored</span>
          </div>
        </div>

        <div className="border-t border-slate-900/80 pt-6 text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Nexora Tools Hub. All rights reserved. Built for creators & pros.</p>
        </div>
      </div>
    </footer>
  );
}

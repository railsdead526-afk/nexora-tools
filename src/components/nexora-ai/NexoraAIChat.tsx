'use client';

import { ArrowUp, History, Loader2, Menu, Plus, Settings, UserCircle, HelpCircle, Sparkles, X, Crown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function NexoraAIChat() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('prompt');
    if (value) setPrompt(value);
    inputRef.current?.focus();
  }, []);

  async function sendMessage() {
    const content = prompt.trim();
    if (!content || loading) return;
    const history = [...messages, { role: 'user' as const, content }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setPrompt('');
    setLoading(true);
    try {
      const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) });
      if (!response.ok || !response.body) throw new Error('Nexora AI belum terhubung ke engine AI.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMessages(current => [...current.slice(0, -1), { role: 'assistant', content: text }]);
      }
    } catch (error) {
      setMessages([...history, { role: 'assistant', content: error instanceof Error ? error.message : 'Terjadi kesalahan.' }]);
    } finally { setLoading(false); }
  }

  return <div className="min-h-[calc(100vh-4rem)] bg-[#070707] text-white">
    <style jsx>{`@keyframes send{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}.send{animation:send 2.8s ease-in-out infinite}.press-glow{transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,background-color .16s ease}.press-glow:active{transform:scale(.95);box-shadow:0 0 0 5px rgba(249,115,22,.12),0 0 28px rgba(249,115,22,.32)!important;border-color:rgba(249,115,22,.55)!important;background-color:rgba(249,115,22,.08)!important}`}</style>
    {menuOpen && <><button className="fixed inset-0 z-[60] bg-black/45" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" /><aside className="fixed inset-y-0 left-0 z-[70] flex w-[min(320px,84vw)] flex-col border-r border-white/[0.07] bg-[#0a0a0a] shadow-2xl shadow-black/60"><div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-black"><Sparkles className="h-4 w-4" /></div><b className="text-sm">Nexora AI</b></div><button className="press-glow rounded-xl p-2 text-zinc-500" onClick={() => setMenuOpen(false)} aria-label="Tutup"><X className="h-4 w-4" /></button></div><div className="shrink-0 space-y-1 border-b border-white/[0.06] p-3"><Link href="/pro" className="press-glow flex items-center gap-3 rounded-xl border border-orange-500/15 bg-orange-500/[0.05] px-3 py-3 text-xs font-bold text-orange-300"><Crown className="h-4 w-4" /> Nexora AI Pro</Link><div className="grid grid-cols-3 gap-1"><Link href="/settings" className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] text-zinc-500"><Settings className="h-4 w-4" />Pengaturan</Link><Link href="/profile" className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] text-zinc-500"><UserCircle className="h-4 w-4" />Profil</Link><Link href="/help" className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] text-zinc-500"><HelpCircle className="h-4 w-4" />Bantuan</Link></div></div><div className="min-h-0 flex-1 overflow-y-auto p-3"><div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600"><History className="h-3.5 w-3.5" /> Riwayat chat</div><div className="rounded-xl border border-dashed border-white/[0.06] px-3 py-5 text-center text-[11px] text-zinc-600">Belum ada riwayat tersimpan.</div></div></aside></>}
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col px-3 py-4 sm:px-6">
      <header className="flex h-10 shrink-0 items-center"><button type="button" onClick={() => setMenuOpen(true)} className="press-glow flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-black/30 text-zinc-400" aria-label="Buka menu chat"><Menu className="h-5 w-5" /></button><Link href="/nexora-ai" className="ml-3 text-xs font-bold text-zinc-500 hover:text-white">Nexora AI</Link></header>
      <section className="min-h-0 flex-1 overflow-y-auto py-6"><div className="mx-auto flex w-full max-w-3xl flex-col gap-4">{messages.map((message, i) => <div key={`${message.role}-${i}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-orange-500 text-black' : 'rounded-bl-md border border-white/[0.07] bg-white/[0.035] text-zinc-200'}`}>{message.content || <Loader2 className="h-4 w-4 animate-spin text-orange-400" />}</div></div>)}</div></section>
      <div className="mx-auto w-full max-w-3xl pb-2"><div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-2 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl focus-within:border-orange-500/30"><div className="rounded-[21px] border border-white/[0.06] bg-[#0c0c0c] px-3 py-3"><div className="flex items-end gap-2"><button type="button" disabled={loading} className="press-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-zinc-400 disabled:opacity-40" aria-label="Lampirkan file"><Plus className="h-5 w-5" /></button><input ref={inputRef} value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }} placeholder="Tanya Nexora AI..." className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-zinc-600" /><button type="button" onClick={sendMessage} disabled={!prompt.trim() || loading} className="press-glow send flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-black shadow-lg shadow-orange-500/20 disabled:opacity-30" aria-label="Kirim"><ArrowUp className="h-5 w-5" /></button></div></div></div></div>
    </main>
  </div>;
}

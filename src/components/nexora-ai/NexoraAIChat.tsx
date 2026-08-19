'use client';

import { ArrowUp, History, Loader2, Menu, Plus, Settings, UserCircle, HelpCircle, Sparkles, X, Crown, Trash2, Pencil, MessageSquarePlus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };
type Conversation = { id: string; title: string; messages: Message[]; updatedAt: number };

const STORAGE_KEY = 'nexora-ai-conversations-v1';

function makeConversation(): Conversation {
  return { id: crypto.randomUUID(), title: 'Chat baru', messages: [], updatedAt: Date.now() };
}

function titleFrom(text: string) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 38 ? `${clean.slice(0, 38)}…` : clean || 'Chat baru';
}

export default function NexoraAIChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = conversations.find((item) => item.id === activeId);
  const messages = active?.messages ?? [];

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Conversation[];
      if (Array.isArray(stored) && stored.length) {
        setConversations(stored);
        setActiveId(stored[0].id);
      } else {
        const fresh = makeConversation();
        setConversations([fresh]);
        setActiveId(fresh.id);
      }
    } catch {
      const fresh = makeConversation();
      setConversations([fresh]);
      setActiveId(fresh.id);
    }
    const value = new URLSearchParams(window.location.search).get('prompt');
    if (value) setPrompt(value);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (conversations.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  function newChat() {
    if (loading) return;
    const fresh = makeConversation();
    setConversations((current) => [fresh, ...current]);
    setActiveId(fresh.id);
    setPrompt('');
    setMenuOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function deleteChat(id: string) {
    if (loading) return;
    setConversations((current) => {
      const next = current.filter((item) => item.id !== id);
      if (!next.length) {
        const fresh = makeConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) setActiveId(next[0].id);
      return next;
    });
  }

  async function sendMessage() {
    const content = prompt.trim();
    if (!content || loading || !activeId) return;
    const history = [...messages, { role: 'user' as const, content }];
    setConversations((current) => current.map((item) => item.id === activeId ? { ...item, title: item.messages.length ? item.title : titleFrom(content), messages: [...history, { role: 'assistant', content: '' }], updatedAt: Date.now() } : item));
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
        setConversations((current) => current.map((item) => item.id === activeId ? { ...item, messages: [...history, { role: 'assistant', content: text }], updatedAt: Date.now() } : item));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Terjadi kesalahan.';
      setConversations((current) => current.map((item) => item.id === activeId ? { ...item, messages: [...history, { role: 'assistant', content: message }], updatedAt: Date.now() } : item));
    } finally {
      setLoading(false);
    }
  }

  return <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-orange-500/20">
    <style jsx>{`@keyframes glow{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.45;transform:scale(1.04)}}.glow{animation:glow 7s ease-in-out infinite}.press-glow{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background-color .18s ease}.press-glow:hover{border-color:rgba(198,90,22,.22)}.press-glow:active{transform:scale(.97);box-shadow:0 0 0 4px rgba(198,90,22,.08),0 0 24px rgba(198,90,22,.12)!important}@media(prefers-reduced-motion:reduce){.glow{animation:none}.press-glow{transition:none}}`}</style>
    <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="glow absolute left-1/2 top-[-280px] h-[560px] w-[820px] -translate-x-1/2 rounded-full bg-orange-900/10 blur-[140px]" /></div>
    {menuOpen && <><button className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" /><aside className="fixed inset-y-0 left-0 z-[70] flex w-[min(340px,88vw)] flex-col border-r border-white/[0.07] bg-[#070707]/98 shadow-2xl shadow-black/70 backdrop-blur-2xl"><div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c65a16] text-black"><Sparkles className="h-4 w-4" /></div><b className="text-sm">Nexora AI</b></div><button className="press-glow rounded-xl p-2 text-zinc-500 hover:text-white" onClick={() => setMenuOpen(false)} aria-label="Tutup"><X className="h-4 w-4" /></button></div><div className="border-b border-white/[0.06] p-3"><button type="button" onClick={newChat} className="press-glow flex w-full items-center gap-3 rounded-xl border border-[#c65a16]/20 bg-[#c65a16]/[0.06] px-3 py-3 text-xs font-bold text-[#e06b1f]"><MessageSquarePlus className="h-4 w-4" /> Chat baru <span className="ml-auto text-[10px] text-zinc-600">Ctrl + N</span></button></div><div className="min-h-0 flex-1 overflow-y-auto p-3"><div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600"><History className="h-3.5 w-3.5" /> Riwayat</div>{conversations.length ? <div className="space-y-1">{conversations.sort((a,b) => b.updatedAt-a.updatedAt).map((item) => <div key={item.id} className={`group flex items-center gap-2 rounded-xl border px-2 py-2 ${item.id === activeId ? 'border-[#c65a16]/20 bg-[#c65a16]/[0.05]' : 'border-transparent hover:bg-white/[0.035]'}`}><button type="button" onClick={() => { setActiveId(item.id); setMenuOpen(false); }} className="min-w-0 flex-1 text-left"><p className="truncate text-[11px] font-semibold text-zinc-300">{item.title}</p><p className="mt-0.5 text-[9px] text-zinc-700">{item.messages.length} pesan</p></button><button type="button" onClick={() => deleteChat(item.id)} className="rounded-lg p-1.5 text-zinc-700 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400" aria-label={`Hapus ${item.title}`}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div> : <div className="rounded-xl border border-dashed border-white/[0.07] px-3 py-5 text-center text-[11px] text-zinc-600">Belum ada riwayat.</div>}</div><div className="border-t border-white/[0.06] p-3"><div className="grid grid-cols-3 gap-1"><Link href="/settings" className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] text-zinc-500 hover:text-white"><Settings className="h-4 w-4" />Pengaturan</Link><Link href="/profile" className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] text-zinc-500 hover:text-white"><UserCircle className="h-4 w-4" />Profil</Link><Link href="/help" className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] text-zinc-500 hover:text-white"><HelpCircle className="h-4 w-4" />Bantuan</Link></div><Link href="/pro" className="mt-2 flex items-center gap-2 rounded-xl border border-[#8b6ccf]/15 bg-[#8b6ccf]/[0.04] px-3 py-2.5 text-[10px] font-bold text-[#a995e2]"><Crown className="h-3.5 w-3.5" /> Nexora AI Pro</Link></div></aside></>}
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-3 py-4 sm:px-6"><header className="flex h-10 shrink-0 items-center"><button type="button" onClick={() => setMenuOpen(true)} className="press-glow flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/45 text-zinc-400 backdrop-blur-xl hover:text-white" aria-label="Buka menu chat"><Menu className="h-5 w-5" /></button></header><section className="min-h-0 flex-1 overflow-y-auto py-6"><div className="mx-auto flex w-full max-w-3xl flex-col gap-4">{messages.length === 0 && <div className="flex min-h-[55vh] flex-col items-center justify-center text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c65a16]/15 bg-[#c65a16]/[0.05] text-[#c65a16]"><Sparkles className="h-5 w-5" /></div><h1 className="text-xl font-bold text-zinc-100">Apa yang ingin kamu kerjakan?</h1><p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">Tulis pertanyaan, ide, atau masalah coding. Percakapanmu tersimpan di perangkat ini.</p></div>}{messages.map((message, i) => <div key={`${message.role}-${i}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'rounded-br-md bg-[#c65a16] text-white shadow-[#c65a16]/10' : 'rounded-bl-md border border-white/[0.07] bg-white/[0.035] text-zinc-200'}`}>{message.content || <Loader2 className="h-4 w-4 animate-spin text-[#c65a16]" />}</div></div>)}</div></section><div className="mx-auto w-full max-w-3xl pb-2"><div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-2 shadow-[0_20px_70px_rgba(0,0,0,.5)] backdrop-blur-xl focus-within:border-[#c65a16]/30"><div className="rounded-[21px] border border-white/[0.06] bg-[#0a0a0a] px-3 py-3"><div className="flex items-end gap-2"><button type="button" disabled={loading} className="press-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-zinc-400 disabled:opacity-40" aria-label="Lampirkan file"><Plus className="h-5 w-5" /></button><input ref={inputRef} value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Tanya Nexora AI..." className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-zinc-600" /><button type="button" onClick={sendMessage} disabled={!prompt.trim() || loading} className="press-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c65a16] text-white shadow-lg shadow-[#c65a16]/10 hover:bg-[#e06b1f] disabled:opacity-30" aria-label="Kirim"><ArrowUp className="h-5 w-5" /></button></div></div></div></div></main>
  </div>;
}

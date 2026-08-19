'use client';

import { ArrowUp, History, Loader2, Menu, Plus, Settings, UserCircle, HelpCircle, Sparkles, X, Crown, Trash2, MessageSquarePlus, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Message = { role: 'user' | 'assistant'; content: string };
type Conversation = { id: string; title: string; messages: Message[]; updatedAt: number };
type ApiConversation = { id: string; title: string; created_at: string; updated_at: string; ai_messages?: { id: string; role: 'user' | 'assistant' | 'system'; content: string; created_at: string }[] };

function normalize(item: ApiConversation): Conversation {
  return { id: item.id, title: item.title, updatedAt: new Date(item.updated_at).getTime(), messages: (item.ai_messages ?? []).filter((m) => m.role === 'user' || m.role === 'assistant').sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map(({ role, content }) => ({ role, content })) };
}

export default function NexoraAIChatDb() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const active = conversations.find((item) => item.id === activeId);
  const messages = active?.messages ?? [];

  const apiFetch = useCallback(async (input: string, init: RequestInit = {}) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { setAuthRequired(true); throw new Error('Silakan masuk untuk menyimpan percakapan.'); }
    const headers = new Headers(init.headers); headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return fetch(input, { ...init, headers });
  }, []);

  const createChat = useCallback(async () => {
    const response = await apiFetch('/api/ai/conversations', { method: 'POST', body: JSON.stringify({}) });
    if (!response.ok) throw new Error('Gagal membuat chat baru.');
    const result = (await response.json()) as { conversation: ApiConversation };
    return normalize(result.conversation);
  }, [apiFetch]);

  const load = useCallback(async () => {
    setLoadingHistory(true); setError('');
    try {
      const response = await apiFetch('/api/ai/conversations');
      if (!response.ok) throw new Error('Gagal mengambil riwayat chat.');
      const result = (await response.json()) as { conversations: ApiConversation[] };
      const next = (result.conversations ?? []).map(normalize);
      if (next.length) { setConversations(next); setActiveId(next[0].id); }
      else { const fresh = await createChat(); setConversations([fresh]); setActiveId(fresh.id); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal memuat NexoraAI.'); }
    finally { setLoadingHistory(false); }
  }, [apiFetch, createChat]);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('prompt'); if (value) setPrompt(value);
    void load(); inputRef.current?.focus();
  }, [load]);

  async function newChat() {
    if (loading) return;
    try { const fresh = await createChat(); setConversations((current) => [fresh, ...current]); setActiveId(fresh.id); setPrompt(''); setMenuOpen(false); setError(''); requestAnimationFrame(() => inputRef.current?.focus()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Gagal membuat chat baru.'); }
  }

  async function deleteChat(id: string) {
    if (loading) return;
    try {
      const response = await apiFetch(`/api/ai/conversations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Gagal menghapus chat.');
      const next = conversations.filter((item) => item.id !== id);
      if (!next.length) { const fresh = await createChat(); setConversations([fresh]); setActiveId(fresh.id); return; }
      setConversations(next); if (activeId === id) setActiveId(next[0].id);
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal menghapus chat.'); }
  }

  async function sendMessage() {
    const content = prompt.trim(); if (!content || loading || !activeId) return;
    setPrompt(''); setLoading(true); setError('');
    const previous = active?.messages ?? [];
    const title = active?.title === 'Chat baru' ? content.replace(/\s+/g, ' ').slice(0, 38) + (content.length > 38 ? '…' : '') : active?.title;
    setConversations((current) => current.map((item) => item.id === activeId ? { ...item, title: title ?? item.title, messages: [...previous, { role: 'user', content }, { role: 'assistant', content: '' }], updatedAt: Date.now() } : item));
    try {
      const response = await apiFetch('/api/ai/chat', { method: 'POST', body: JSON.stringify({ conversationId: activeId, content }) });
      if (!response.ok || !response.body) { const result = (await response.json().catch(() => ({}))) as { error?: string }; throw new Error(result.error || 'Nexora AI gagal memproses pesan.'); }
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let text = '';
      while (true) { const { value, done } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }); setConversations((current) => current.map((item) => item.id === activeId ? { ...item, messages: [...previous, { role: 'user', content }, { role: 'assistant', content: text }], updatedAt: Date.now() } : item)); }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setConversations((current) => current.map((item) => item.id === activeId ? { ...item, messages: [...previous, { role: 'user', content }, { role: 'assistant', content: message }] } : item)); setError(message);
    } finally { setLoading(false); }
  }

  return <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-orange-500/20">
    <style jsx>{`@keyframes glow{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:.38;transform:scale(1.04)}}.glow{animation:glow 7s ease-in-out infinite}.press-glow{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background-color .18s ease}.press-glow:hover{border-color:rgba(198,90,22,.22)}.press-glow:active{transform:scale(.97);box-shadow:0 0 0 4px rgba(198,90,22,.08),0 0 24px rgba(198,90,22,.12)!important}@media(prefers-reduced-motion:reduce){.glow{animation:none}.press-glow{transition:none}}`}</style>
    <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="glow absolute left-1/2 top-[-280px] h-[560px] w-[820px] -translate-x-1/2 rounded-full bg-orange-900/10 blur-[140px]" /></div>
    {menuOpen && <><button className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px]" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" /><aside className="fixed inset-y-0 left-0 z-[70] flex w-[min(340px,88vw)] flex-col border-r border-white/[0.07] bg-[#070707]/98 shadow-2xl shadow-black/70 backdrop-blur-2xl"><div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c65a16] text-black"><Sparkles className="h-4 w-4" /></div><b className="text-sm">Nexora AI</b></div><button className="press-glow rounded-xl p-2 text-zinc-500 hover:text-white" onClick={() => setMenuOpen(false)} aria-label="Tutup"><X className="h-4 w-4" /></button></div><div className="border-b border-white/[0.06] p-3"><button type="button" onClick={() => void newChat()} className="press-glow flex w-full items-center gap-3 rounded-xl border border-[#c65a16]/20 bg-[#c65a16]/[0.06] px-3 py-3 text-xs font-bold text-[#e06b1f]"><MessageSquarePlus className="h-4 w-4" /> Chat baru</button></div><div className="min-h-0 flex-1 overflow-y-auto p-3"><div className="mb-2 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600"><History className="h-3.5 w-3.5" /> Riwayat</div>{loadingHistory ? <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-[#c65a16]" /></div> : conversations.length ? <div className="space-y-1">{[...conversations].sort((a,b) => b.updatedAt-a.updatedAt).map((item) => <div key={item.id} className={`group flex items-center gap-2 rounded-xl border px-2 py-2 ${item.id === activeId ? 'border-[#c65a16]/20 bg-[#c65a16]/[0.05]' : 'border-transparent hover:bg-white/[0.035]'}`}><button type="button" onClick={() => { setActiveId(item.id); setMenuOpen(false); }} className="min-w-0 flex-1 text-left"><p className="truncate text-[11px] font-semibold text-zinc-300">{item.title}</p><p className="mt-0.5 text-[9px] text-zinc-700">{item.messages.length} pesan</p></button><button type="button" onClick={() => void deleteChat(item.id)} className="rounded-lg p-1.5 text-zinc-700 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400" aria-label={`Hapus ${item.title}`}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div> : <div className="rounded-xl border border-dashed border-white/[0.07] px-3 py-5 text-center text-[11px] text-zinc-600">Belum ada riwayat.</div>}</div><div className="border-t border-white/[0.06] p-3"><div className="grid grid-cols-3 gap-1"><Link href="/settings" className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] text-zinc-500 hover:text-white"><Settings className="h-4 w-4" />Pengaturan</Link><Link href="/profile" className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] text-zinc-500 hover:text-white"><UserCircle className="h-4 w-4" />Profil</Link><Link href="/help" className="press-glow flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] text-zinc-500 hover:text-white"><HelpCircle className="h-4 w-4" />Bantuan</Link></div><Link href="/pro" className="mt-2 flex items-center gap-2 rounded-xl border border-[#8b6ccf]/15 bg-[#8b6ccf]/[0.04] px-3 py-2.5 text-[10px] font-bold text-[#a995e2]"><Crown className="h-3.5 w-3.5" /> Nexora AI Pro</Link></div></aside></>}
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-3 py-4 sm:px-6"><header className="flex h-10 shrink-0 items-center"><button type="button" onClick={() => setMenuOpen(true)} className="press-glow flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/45 text-zinc-400 backdrop-blur-xl hover:text-white" aria-label="Buka menu chat"><Menu className="h-5 w-5" /></button></header>{authRequired ? <section className="flex flex-1 items-center justify-center px-4"><div className="w-full max-w-sm rounded-3xl border border-white/[0.07] bg-white/[0.025] p-7 text-center shadow-2xl shadow-black/40"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c65a16]/15 bg-[#c65a16]/[0.05] text-[#c65a16]"><LogIn className="h-5 w-5" /></div><h1 className="text-lg font-bold">Masuk untuk memakai NexoraAI</h1><p className="mt-2 text-sm leading-6 text-zinc-600">Percakapan disimpan aman di akunmu agar bisa diakses kembali di perangkat lain.</p><Link href="/login" className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-[#c65a16] px-5 text-sm font-bold text-white shadow-lg shadow-[#c65a16]/10 hover:bg-[#e06b1f]">Masuk</Link></div></section> : <><section className="min-h-0 flex-1 overflow-y-auto py-6"><div className="mx-auto flex w-full max-w-3xl flex-col gap-4">{error && <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] px-3 py-2 text-xs text-red-300">{error}</div>}{messages.length === 0 && !loadingHistory && <div className="flex min-h-[55vh] flex-col items-center justify-center text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c65a16]/15 bg-[#c65a16]/[0.05] text-[#c65a16]"><Sparkles className="h-5 w-5" /></div><h1 className="text-xl font-bold text-zinc-100">Apa yang ingin kamu kerjakan?</h1><p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">Tulis pertanyaan, ide, atau masalah coding. Percakapanmu tersimpan di akunmu.</p></div>}{messages.map((message, i) => <div key={`${message.role}-${i}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'rounded-br-md bg-[#c65a16] text-white shadow-[#c65a16]/10' : 'rounded-bl-md border border-white/[0.07] bg-white/[0.035] text-zinc-200'}`}>{message.content || <Loader2 className="h-4 w-4 animate-spin text-[#c65a16]" />}</div></div>)}</div></section><div className="mx-auto w-full max-w-3xl pb-2"><div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-2 shadow-[0_20px_70px_rgba(0,0,0,.5)] backdrop-blur-xl focus-within:border-[#c65a16]/30"><div className="rounded-[21px] border border-white/[0.06] bg-[#0a0a0a] px-3 py-3"><div className="flex items-end gap-2"><button type="button" disabled={loading} className="press-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-zinc-400 disabled:opacity-40" aria-label="Lampirkan file"><Plus className="h-5 w-5" /></button><input ref={inputRef} value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} placeholder="Tanya Nexora AI..." className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-zinc-600" /><button type="button" onClick={() => void sendMessage()} disabled={!prompt.trim() || loading} className="press-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c65a16] text-white shadow-lg shadow-[#c65a16]/10 hover:bg-[#e06b1f] disabled:opacity-30" aria-label="Kirim"><ArrowUp className="h-5 w-5" /></button></div></div></div></div></main></>}
  </div>;
}

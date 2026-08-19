'use client';

import { ArrowUp, History, Loader2, Menu, Plus, Settings, UserCircle, HelpCircle, Sparkles, X, Trash2, MessageSquarePlus, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Message = { role: 'user' | 'assistant'; content: string };
type Conversation = { id: string; title: string; messages: Message[]; updatedAt: number };
type ApiMessage = { id: string; role: 'user' | 'assistant' | 'system'; content: string; created_at: string };
type ApiConversation = { id: string; title: string; created_at: string; updated_at: string; ai_messages?: ApiMessage[] };

function normalize(item: ApiConversation): Conversation {
  const messages: Message[] = (item.ai_messages ?? [])
    .filter((message): message is ApiMessage & { role: 'user' | 'assistant' } => message.role === 'user' || message.role === 'assistant')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(({ role, content }) => ({ role, content }));
  return { id: item.id, title: item.title, updatedAt: new Date(item.updated_at).getTime(), messages };
}

type SidebarProps = { open: boolean; conversations: Conversation[]; activeId: string; loadingHistory: boolean; onClose: () => void; onNewChat: () => void; onSelect: (id: string) => void; onDelete: (id: string) => void };

function ChatSidebar({ open, conversations, activeId, loadingHistory, onClose, onNewChat, onSelect, onDelete }: SidebarProps) {
  if (!open) return null;
  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px]" onClick={onClose} aria-label="Tutup menu" />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(340px,88vw)] flex-col border-r border-white/10 bg-[#070707]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#c65a16]" /><b className="text-sm text-zinc-100">Nexora AI</b></div><button type="button" onClick={onClose} aria-label="Tutup menu" className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"><X className="h-5 w-5" /></button></div>
        <button type="button" onClick={onNewChat} className="mt-5 flex w-full items-center gap-2 rounded-xl border border-[#c65a16]/15 bg-[#c65a16]/[0.07] p-3 text-left text-sm font-semibold text-[#d88957] transition hover:border-[#c65a16]/25 hover:bg-[#c65a16]/10"><MessageSquarePlus className="h-4 w-4" />Chat baru</button>
        <div className="mt-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600"><History className="h-3.5 w-3.5" />Riwayat</div>
        <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">{loadingHistory ? <Loader2 className="mx-auto mt-6 h-4 w-4 animate-spin text-[#c65a16]" /> : conversations.length ? conversations.map((item) => <div key={item.id} className={`group flex items-center gap-2 rounded-xl border px-2 py-1 transition ${item.id === activeId ? 'border-[#c65a16]/20 bg-[#c65a16]/[0.05]' : 'border-transparent hover:bg-white/[0.035]'}`}><button type="button" onClick={() => onSelect(item.id)} className="min-w-0 flex-1 truncate p-2 text-left text-sm text-zinc-300">{item.title}</button><button type="button" onClick={() => onDelete(item.id)} className="rounded-lg p-2 text-zinc-700 transition hover:bg-white/[0.04] hover:text-red-400" aria-label={`Hapus ${item.title}`}><Trash2 className="h-4 w-4" /></button></div>) : <p className="mt-5 rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-zinc-600">Belum ada riwayat.</p>}</div>
        <div className="border-t border-white/10 pt-3 text-xs text-zinc-500"><div className="flex gap-4"><Link className="transition hover:text-zinc-200" href="/settings"><Settings className="mr-1 inline h-3.5 w-3.5" />Pengaturan</Link><Link className="transition hover:text-zinc-200" href="/profile"><UserCircle className="mr-1 inline h-3.5 w-3.5" />Profil</Link><Link className="transition hover:text-zinc-200" href="/help"><HelpCircle className="mr-1 inline h-3.5 w-3.5" />Bantuan</Link></div></div>
      </aside>
    </>
  );
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const active = conversations.find((item) => item.id === activeId);
  const messages = active?.messages ?? [];

  const apiFetch = useCallback(async (input: string, init: RequestInit = {}) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error('Supabase belum dikonfigurasi.');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { setAuthRequired(true); throw new Error('Silakan masuk untuk menyimpan percakapan.'); }
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return fetch(input, { ...init, headers });
  }, []);

  const createChat = useCallback(async () => {
    const response = await apiFetch('/api/ai/conversations', { method: 'POST', body: '{}' });
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
      if (next.length) { setConversations(next); setActiveId(next[0].id); } else { const fresh = await createChat(); setConversations([fresh]); setActiveId(fresh.id); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal memuat NexoraAI.'); } finally { setLoadingHistory(false); }
  }, [apiFetch, createChat]);

  useEffect(() => { const value = new URLSearchParams(window.location.search).get('prompt'); if (value) setPrompt(value); void load(); }, [load]);

  async function newChat() {
    if (loading) return;
    try { const fresh = await createChat(); setConversations((current) => [fresh, ...current]); setActiveId(fresh.id); setPrompt(''); setMenuOpen(false); setError(''); inputRef.current?.focus(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Gagal membuat chat baru.'); }
  }

  async function deleteChat(id: string) {
    if (loading) return;
    try {
      const response = await apiFetch(`/api/ai/conversations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Gagal menghapus chat.');
      const next = conversations.filter((item) => item.id !== id);
      if (!next.length) { const fresh = await createChat(); setConversations([fresh]); setActiveId(fresh.id); }
      else { setConversations(next); if (activeId === id) setActiveId(next[0].id); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Gagal menghapus chat.'); }
  }

  async function sendMessage() {
    const content = prompt.trim();
    if (!content || loading || !activeId) return;
    setPrompt(''); setLoading(true); setError('');
    const previous = active?.messages ?? [];
    const title = active?.title === 'Chat baru' ? content.replace(/\s+/g, ' ').slice(0, 38) + (content.length > 38 ? '…' : '') : active?.title;
    const optimistic = [...previous, { role: 'user' as const, content }, { role: 'assistant' as const, content: '' }];
    setConversations((current) => current.map((item) => item.id === activeId ? { ...item, title: title ?? item.title, messages: optimistic, updatedAt: Date.now() } : item));
    try {
      const response = await apiFetch('/api/ai/chat', { method: 'POST', body: JSON.stringify({ conversationId: activeId, content }) });
      if (!response.ok || !response.body) { const result = (await response.json().catch(() => ({}))) as { error?: string }; throw new Error(result.error || 'Nexora AI gagal memproses pesan.'); }
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let text = '';
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        text += decoder.decode(value, { stream: true });
        setConversations((current) => current.map((item) => item.id === activeId ? { ...item, messages: [...previous, { role: 'user' as const, content }, { role: 'assistant' as const, content: text }], updatedAt: Date.now() } : item));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setConversations((current) => current.map((item) => item.id === activeId ? { ...item, messages: [...previous, { role: 'user' as const, content }, { role: 'assistant' as const, content: message }] } : item));
      setError(message);
    } finally { setLoading(false); }
  }

  if (authRequired) return <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white"><div className="max-w-sm text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c65a16]/15 bg-[#c65a16]/[0.06]"><LogIn className="text-[#c65a16]" /></div><h1 className="text-lg font-bold tracking-tight text-zinc-100">Masuk untuk memakai NexoraAI</h1><p className="mt-2 text-sm leading-6 text-zinc-500">Percakapanmu disimpan dengan aman di akunmu.</p><Link href="/login" className="mt-5 inline-block rounded-xl bg-[#c65a16] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d16a27]">Masuk</Link></div></div>;

  return <div className="min-h-screen bg-[#050505] text-white selection:bg-[#c65a16]/30"><header className="sticky top-0 z-30 bg-[#050505]/75 p-4 backdrop-blur-xl"><button type="button" onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-zinc-500 shadow-sm transition hover:border-white/15 hover:bg-white/[0.05] hover:text-zinc-100" aria-label="Buka menu chat"><Menu className="h-5 w-5" /></button></header><ChatSidebar open={menuOpen} conversations={conversations} activeId={activeId} loadingHistory={loadingHistory} onClose={() => setMenuOpen(false)} onNewChat={() => void newChat()} onSelect={(id) => { setActiveId(id); setMenuOpen(false); }} onDelete={(id) => void deleteChat(id)} /><main className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-3xl flex-col px-4 sm:px-6"><section className="flex-1 overflow-y-auto py-8">{error && <div className="mb-5 rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-3.5 text-xs leading-5 text-red-300">{error}</div>}{!loadingHistory && messages.length === 0 && <div className="flex min-h-[55vh] flex-col items-center justify-center text-center"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#8b6ccf]/20 bg-[#8b6ccf]/[0.06] shadow-[0_0_40px_rgba(139,108,207,0.08)]"><Sparkles className="h-5 w-5 text-[#8b6ccf]" /></div><h1 className="bg-gradient-to-r from-zinc-100 via-[#cfc4ee] to-[#c65a16] bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">Apa yang ingin kamu kerjakan?</h1><p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">Tulis ide, pertanyaan, atau pekerjaan yang ingin kamu selesaikan bersama NexoraAI.</p></div>}{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${message.role === 'user' ? 'bg-[#c65a16] text-white shadow-[#c65a16]/10' : 'border border-white/[0.07] bg-white/[0.025] text-zinc-200'}`}>{message.content || <Loader2 className="h-4 w-4 animate-spin text-[#c65a16]" />}</div></div>)}</section><div className="sticky bottom-0 pb-4 pt-2"><div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#0a0a0a]/95 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl transition focus-within:border-white/15"><button type="button" disabled={loading} className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-30" aria-label="Lampirkan file"><Plus className="h-5 w-5" /></button><textarea ref={inputRef} value={prompt} rows={1} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Tanya NexoraAI..." className="max-h-32 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-5 text-zinc-100 outline-none placeholder:text-zinc-600" /><button type="button" onClick={() => void sendMessage()} disabled={!prompt.trim() || loading} className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c65a16] text-white shadow-lg shadow-[#c65a16]/10 transition hover:bg-[#d16a27] disabled:cursor-not-allowed disabled:opacity-30" aria-label="Kirim"><ArrowUp className="h-5 w-5" /></button></div><p className="mt-2 text-center text-[10px] text-zinc-700">NexoraAI dapat membuat kesalahan. Periksa informasi penting.</p></div></main></div>;

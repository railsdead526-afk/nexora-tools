'use client';

import { ArrowUp, History, Loader2, Menu, Plus, Settings, UserCircle, HelpCircle, Sparkles, X, Trash2, MessageSquarePlus, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type Message = { role: 'user' | 'assistant'; content: string };
type Conversation = { id: string; title: string; messages: Message[]; updatedAt: number };
type ApiConversation = { id: string; title: string; created_at: string; updated_at: string; ai_messages?: { id: string; role: 'user' | 'assistant' | 'system'; content: string; created_at: string }[] };

function normalize(item: ApiConversation): Conversation {
  return {
    id: item.id,
    title: item.title,
    updatedAt: new Date(item.updated_at).getTime(),
    messages: (item.ai_messages ?? [])
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map(({ role, content }) => ({ role, content })),
  };
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
    if (!token) {
      setAuthRequired(true);
      throw new Error('Silakan masuk untuk menyimpan percakapan.');
    }
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
    setLoadingHistory(true);
    setError('');
    try {
      const response = await apiFetch('/api/ai/conversations');
      if (!response.ok) throw new Error('Gagal mengambil riwayat chat.');
      const result = (await response.json()) as { conversations: ApiConversation[] };
      const next = (result.conversations ?? []).map(normalize);
      if (next.length) {
        setConversations(next);
        setActiveId(next[0].id);
      } else {
        const fresh = await createChat();
        setConversations([fresh]);
        setActiveId(fresh.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat NexoraAI.');
    } finally {
      setLoadingHistory(false);
    }
  }, [apiFetch, createChat]);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('prompt');
    if (value) setPrompt(value);
    void load();
    inputRef.current?.focus();
  }, [load]);

  async function newChat() {
    if (loading) return;
    try {
      const fresh = await createChat();
      setConversations((current) => [fresh, ...current]);
      setActiveId(fresh.id);
      setPrompt('');
      setMenuOpen(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat chat baru.');
    }
  }

  async function deleteChat(id: string) {
    if (loading) return;
    try {
      const response = await apiFetch(`/api/ai/conversations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Gagal menghapus chat.');
      const next = conversations.filter((item) => item.id !== id);
      if (!next.length) {
        const fresh = await createChat();
        setConversations([fresh]);
        setActiveId(fresh.id);
        return;
      }
      setConversations(next);
      if (activeId === id) setActiveId(next[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus chat.');
    }
  }

  async function sendMessage() {
    const content = prompt.trim();
    if (!content || loading || !activeId) return;
    setPrompt('');
    setLoading(true);
    setError('');
    const previous = active?.messages ?? [];
    const title = active?.title === 'Chat baru'
      ? content.replace(/\s+/g, ' ').slice(0, 38) + (content.length > 38 ? '…' : '')
      : active?.title;

    setConversations((current) => current.map((item) => item.id === activeId
      ? { ...item, title: title ?? item.title, messages: [...previous, { role: 'user', content }, { role: 'assistant', content: '' }], updatedAt: Date.now() }
      : item));

    try {
      const response = await apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ conversationId: activeId, content }),
      });
      if (!response.ok || !response.body) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error || 'Nexora AI gagal memproses pesan.');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setConversations((current) => current.map((item) => item.id === activeId
          ? { ...item, messages: [...previous, { role: 'user', content }, { role: 'assistant', content: text }], updatedAt: Date.now() }
          : item));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setConversations((current) => current.map((item) => item.id === activeId
        ? { ...item, messages: [...previous, { role: 'user', content }, { role: 'assistant', content: message }] }
        : item));
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="p-4">
        <button type="button" onClick={() => setMenuOpen(true)} className="h-10 w-10 rounded-xl border border-white/10 bg-black/50 text-zinc-400" aria-label="Buka menu chat">
          <Menu className="mx-auto h-5 w-5" />
        </button>
      </header>

      {menuOpen && (
        <>
          <button className="fixed inset-0 z-40 bg-black/60" onClick={() => setMenuOpen(false)} aria-label="Tutup menu" />
          <aside className="fixed inset-y-0 left-0 z-50 w-[min(340px,88vw)] border-r border-white/10 bg-[#070707] p-4">
            <div className="flex items-center justify-between">
              <b>Nexora AI</b>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Tutup"><X /></button>
            </div>
            <button type="button" onClick={() => void newChat()} className="mt-5 w-full rounded-xl bg-[#c65a16]/10 p-3 text-left text-[#e06b1f]">
              <MessageSquarePlus className="mr-2 inline h-4 w-4" />Chat baru
            </button>
            <div className="mt-5 flex items-center gap-2 text-xs text-zinc-500"><History className="h-3.5 w-3.5" />Riwayat</div>
            <div className="mt-2 space-y-1">
              {loadingHistory ? <Loader2 className="mx-auto mt-4 animate-spin text-[#c65a16]" /> : conversations.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <button type="button" onClick={() => { setActiveId(item.id); setMenuOpen(false); }} className="min-w-0 flex-1 truncate p-2 text-left text-sm">{item.title}</button>
                  <button type="button" onClick={() => void deleteChat(item.id)} aria-label={`Hapus ${item.title}`}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex gap-4 text-xs text-zinc-500">
              <Link href="/settings"><Settings className="mr-1 inline h-3.5 w-3.5" />Pengaturan</Link>
              <Link href="/profile"><UserCircle className="mr-1 inline h-3.5 w-3.5" />Profil</Link>
              <Link href="/help"><HelpCircle className="mr-1 inline h-3.5 w-3.5" />Bantuan</Link>
            </div>
          </aside>
        </>
      )}

      {authRequired ? (
        <section className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <LogIn className="mx-auto mb-3 text-[#c65a16]" />
            <h1>Masuk untuk memakai NexoraAI</h1>
            <Link href="/login" className="mt-4 inline-block rounded-xl bg-[#c65a16] px-5 py-2">Masuk</Link>
          </div>
        </section>
      ) : (
        <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col px-4">
          <section className="flex-1 overflow-y-auto py-6">
            {error && <div className="mb-3 rounded-xl border border-red-500/20 p-3 text-xs text-red-300">{error}</div>}
            {!loadingHistory && messages.length === 0 && (
              <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                <Sparkles className="mb-3 text-[#c65a16]" />
                <h1 className="text-xl font-bold">Apa yang ingin kamu kerjakan?</h1>
                <p className="mt-2 text-sm text-zinc-600">Percakapanmu tersimpan di akunmu.</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`mb-3 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${message.role === 'user' ? 'bg-[#c65a16]' : 'border border-white/10 bg-white/[0.03]'}`}>
                  {message.content || <Loader2 className="animate-spin text-[#c65a16]" />}
                </div>
              </div>
            ))}
          </section>
          <div className="pb-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0a0a0a] p-2">
              <button type="button" disabled={loading} className="h-10 w-10 rounded-xl border border-white/10" aria-label="Lampirkan file"><Plus className="mx-auto" /></button>
              <input ref={inputRef} value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder="Tanya Nexora AI..." className="min-w-0 flex-1 bg-transparent px-2 outline-none" />
              <button type="button" onClick={() => void sendMessage()} disabled={!prompt.trim() || loading} className="h-10 w-10 rounded-xl bg-[#c65a16] disabled:opacity-30" aria-label="Kirim"><ArrowUp className="mx-auto" /></button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

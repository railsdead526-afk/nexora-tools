'use client';

import { FormEvent, useState } from 'react';
import { Menu, Send } from 'lucide-react';

export default function ChatPage() {
  const [message, setMessage] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;

    // AI conversation wiring can be connected here later.
    setMessage('');
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <button
        type="button"
        aria-label="Buka menu chat"
        className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 backdrop-blur-md transition-colors hover:bg-slate-800 hover:text-white"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 pb-5 pt-20 sm:px-6">
        <div className="flex-1" aria-label="Area percakapan" />

        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex items-end gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl focus-within:border-slate-700">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              placeholder="Tulis pesan..."
              aria-label="Pesan chat"
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500"
            />

            <button
              type="submit"
              disabled={!message.trim()}
              aria-label="Kirim pesan"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

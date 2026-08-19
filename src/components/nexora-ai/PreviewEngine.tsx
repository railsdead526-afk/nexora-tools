'use client';

import { Maximize2, Monitor, Smartphone, Tablet, X } from 'lucide-react';
import { useMemo, useState } from 'react';

type PreviewEngineProps = {
  code: string;
  open: boolean;
  onClose: () => void;
};

type Viewport = 'desktop' | 'tablet' | 'mobile';

const viewportWidth: Record<Viewport, string> = {
  desktop: 'w-full',
  tablet: 'w-[768px] max-w-full',
  mobile: 'w-[390px] max-w-full',
};

function buildDocument(code: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;min-height:100%;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fff;color:#111}*{box-sizing:border-box}</style></head><body>${code}</body></html>`;
}

export default function PreviewEngine({ code, open, onClose }: PreviewEngineProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [fullscreen, setFullscreen] = useState(false);
  const srcDoc = useMemo(() => buildDocument(code), [code]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-[80] flex flex-col bg-[#050505] ${fullscreen ? '' : 'p-3 sm:p-5'}`}>
      <div className="flex shrink-0 items-center justify-between rounded-t-2xl border border-white/10 bg-[#0a0a0a] px-3 py-2">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#8b6ccf]" /><span className="text-sm font-semibold text-zinc-200">Preview</span></div>
        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.025] p-1">
          <button type="button" onClick={() => setViewport('desktop')} className={`rounded-lg p-2 ${viewport === 'desktop' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-600'}`} aria-label="Desktop"><Monitor className="h-4 w-4" /></button>
          <button type="button" onClick={() => setViewport('tablet')} className={`rounded-lg p-2 ${viewport === 'tablet' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-600'}`} aria-label="Tablet"><Tablet className="h-4 w-4" /></button>
          <button type="button" onClick={() => setViewport('mobile')} className={`rounded-lg p-2 ${viewport === 'mobile' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-600'}`} aria-label="Mobile"><Smartphone className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-1"><button type="button" onClick={() => setFullscreen((value) => !value)} className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200" aria-label="Layar penuh"><Maximize2 className="h-4 w-4" /></button><button type="button" onClick={onClose} className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200" aria-label="Tutup preview"><X className="h-5 w-5" /></button></div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto border-x border-b border-white/10 bg-[#111] p-3 sm:p-5">
        <div className={`mx-auto h-full min-h-[calc(100vh-8rem)] overflow-hidden rounded-xl bg-white shadow-2xl transition-all ${viewportWidth[viewport]}`}>
          <iframe title="NexoraAI Preview" srcDoc={srcDoc} sandbox="allow-scripts" className="h-full min-h-[calc(100vh-8rem)] w-full border-0" />
        </div>
      </div>
    </div>
  );
}

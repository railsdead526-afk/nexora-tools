'use client';

import AdSlot from '@/components/AdSlot';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Sparkles, Copy, Check, Key, 
  FileCode, Code, CheckCircle2 
} from 'lucide-react';

function generateRandomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function UuidGeneratorPage() {
  const [activeTab, setActiveTab] = useState<'addon' | 'batch'>('addon');
  const [headerUuid, setHeaderUuid] = useState(generateRandomUUID());
  const [moduleUuid, setModuleUuid] = useState(generateRandomUUID());
  const [addonName, setAddonName] = useState('My Awesome Addon');
  const [addonDesc, setAddonDesc] = useState('Created with Nexora Tools');
  const [batchCount, setBatchCount] = useState(5);
  const [batchUuids, setBatchUuids] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRefreshAddonUuids = () => {
    setHeaderUuid(generateRandomUUID());
    setModuleUuid(generateRandomUUID());
  };

  const handleGenerateBatch = (count: number) => {
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      list.push(generateRandomUUID());
    }
    setBatchUuids(list);
  };

  const manifestTemplate = JSON.stringify(
    {
      format_version: 2,
      header: {
        name: addonName || 'My Awesome Addon',
        description: addonDesc || 'Created with Nexora Tools',
        uuid: headerUuid,
        version: [1, 0, 0],
        min_engine_version: [1, 20, 0],
      },
      modules: [
        {
          type: 'data',
          uuid: moduleUuid,
          version: [1, 0, 0],
        },
      ],
    },
    null,
    2
  );

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-28 space-y-7">
      <AdSlot className="mt-6" />
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Katalog
      </Link>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold shadow-sm">
          <Key className="w-3.5 h-3.5 text-amber-400" /> Developer & Creator Studio
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">UUID & Add-on Studio</h1>
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
          Generator UUID v4 unik instan & template <code>manifest.json</code> otomatis untuk pembuat Add-on Minecraft Bedrock & Developer.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('addon')}
          className={`py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'addon' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" /> Mode Add-on (Minecraft)
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('batch'); handleGenerateBatch(batchCount); }}
          className={`py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'batch' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" /> Mode Batch UUID
        </button>
      </div>

      {/* MODE 1: MINECRAFT ADD-ON STUDIO */}
      {activeTab === 'addon' && (
        <div className="p-5 md:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Pasangan UUID Header & Module:
            </h2>
            <button
              type="button"
              onClick={handleRefreshAddonUuids}
              className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Acak Ulang
            </button>
          </div>

          <div className="space-y-3">
            {/* Header UUID */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-amber-400">Header UUID:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(headerUuid, 'header')}
                  className="text-indigo-400 hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  {copiedKey === 'header' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'header' ? 'Tersalin!' : 'Salin Header'}
                </button>
              </div>
              <p className="font-mono text-xs text-slate-300 select-all break-all">{headerUuid}</p>
            </div>

            {/* Module UUID */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-400">Module UUID:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(moduleUuid, 'module')}
                  className="text-indigo-400 hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  {copiedKey === 'module' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'module' ? 'Tersalin!' : 'Salin Module'}
                </button>
              </div>
              <p className="font-mono text-xs text-slate-300 select-all break-all">{moduleUuid}</p>
            </div>
          </div>

          {/* Form Nama & Template */}
          <div className="pt-2 border-t border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nama Add-on:</label>
                <input
                  type="text"
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Deskripsi Add-on:</label>
                <input
                  type="text"
                  value={addonDesc}
                  onChange={(e) => setAddonDesc(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Template manifest.json:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(manifestTemplate, 'manifest')}
                  className="text-xs font-black text-emerald-400 hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'manifest' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'manifest' ? 'manifest.json Tersalin!' : 'Salin manifest.json Lengkap'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-56">
                {manifestTemplate}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: BATCH UUID */}
      {activeTab === 'batch' && (
        <div className="p-5 md:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-300">Jumlah UUID yang Dibuat:</label>
            <div className="flex gap-1.5 text-xs">
              {[5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => { setBatchCount(num); handleGenerateBatch(num); }}
                  className={`px-3 py-1.5 rounded-xl border font-bold ${
                    batchCount === num ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGenerateBatch(batchCount)}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] font-black text-xs text-white rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate {batchCount} UUID Baru</span>
          </button>

          {batchUuids.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Daftar UUID v4:
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(batchUuids.join('\n'), 'batch_all')}
                  className="text-xs font-black text-amber-400 hover:underline flex items-center gap-1"
                >
                  {copiedKey === 'batch_all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'batch_all' ? 'Semua Tersalin!' : 'Salin Semua UUID'}
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {batchUuids.map((id, index) => (
                  <div key={index} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-300 font-mono select-all truncate pr-2">{id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(id, `batch_${index}`)}
                      className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                    >
                      {copiedKey === `batch_${index}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

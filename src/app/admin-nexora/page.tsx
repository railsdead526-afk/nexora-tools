'use client';

import { useState } from 'react';
import { Shield, Key, UserCheck, Trash2, Clock, Calendar } from 'lucide-react';

interface ProUser {
  email: string;
  expiresAt: number;
  activatedAt: string;
}

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [proList, setProList] = useState<ProUser[]>([]);
  const [message, setMessage] = useState('');

  const fetchProList = async () => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_all', pin: '9988' }),
    });
    const data = await res.json();
    if (data.proUsers) setProList(data.proUsers);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '9988') {
      setIsUnlocked(true);
      fetchProList();
    } else {
      alert('PIN Salah!');
    }
  };

  const handleActivateEmail = async () => {
    if (!emailInput.trim()) return;
    const cleanEmail = emailInput.trim().toLowerCase();

    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'activate_email', email: cleanEmail, days: Number(durationDays), pin: '9988' }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`✓ ${cleanEmail} AKTIF PRO SELAMA ${durationDays} HARI!`);
      setEmailInput('');
      setProList(data.proUsers);
    }
  };

  const handleRemove = async (targetEmail: string) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deactivate_email', email: targetEmail, pin: '9988' }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`Status PRO untuk ${targetEmail} dicabut.`);
      setProList(data.proUsers);
    }
  };

  const getDaysRemaining = (exp: number) => {
    const remaining = Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24));
    return remaining > 0 ? `${remaining} hari lagi` : 'Kadaluarsa';
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <form onSubmit={handleUnlock} className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <Key className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white">Nexora Security Portal</h1>
          <p className="text-xs text-slate-400">Masukkan PIN Admin</p>
          <input
            type="password"
            placeholder="PIN (9988)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="w-full py-3 bg-indigo-600 font-bold text-xs text-white rounded-xl">
            Buka Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase">
        <Shield className="w-4 h-4" /> Admin Portal
      </div>

      <h1 className="text-2xl font-black text-white">Manajemen Langganan PRO</h1>

      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Form Aktivasi Otomatis */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
        <h2 className="text-xs font-bold text-slate-300">Aktivasi Member Baru:</h2>
        <input
          type="email"
          placeholder="Ketik email pembeli... (contoh: ahmad@gmail.com)"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
        />

        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Durasi:
          </label>
          <select
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value={30}>1 Bulan (30 Hari)</option>
            <option value={90}>3 Bulan (90 Hari)</option>
            <option value={365}>1 Tahun (365 Hari)</option>
          </select>

          <button
            onClick={handleActivateEmail}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white rounded-xl"
          >
            Aktifkan Sekarang
          </button>
        </div>
      </div>

      {/* Daftar Member dengan Countdown Sisa Hari */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
        <h2 className="text-xs font-bold text-slate-300">Member PRO Aktif ({proList.length}):</h2>
        {proList.length === 0 ? (
          <p className="text-xs text-slate-500">Belum ada member aktif.</p>
        ) : (
          <div className="space-y-2">
            {proList.map((user, idx) => (
              <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div>
                  <p className="text-emerald-400 font-semibold">{user.email}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Sisa Waktu: <span className="text-amber-400 font-bold">{getDaysRemaining(user.expiresAt)}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(user.email)}
                  className="text-red-400 hover:text-red-300 p-1"
                  title="Cabut Akses Sekarang"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

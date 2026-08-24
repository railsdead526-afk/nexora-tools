'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface NexoraUser {
  id: string;
  email: string;
  name: string;
}

interface UserContextType {
  user: NexoraUser | null;
  session: Session | null;
  loading: boolean;
  isPro: boolean;
  daysLeft: number;
  proExpiresAt: string | null;
  refreshStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  loading: true,
  isPro: false,
  daysLeft: 0,
  proExpiresAt: null,
  refreshStatus: async () => {},
  signOut: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const [isPro, setIsPro] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      setIsPro(false);
      setDaysLeft(0);
      setProExpiresAt(null);
      return;
    }

    try {
      const response = await fetch('/api/account/status', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Gagal memuat status akun.');
      setIsPro(Boolean(data.isPro));
      setDaysLeft(Number(data.daysLeft || 0));
      setProExpiresAt(data.expiresAt || null);
    } catch {
      setIsPro(false);
      setDaysLeft(0);
      setProExpiresAt(null);
    }
  }, [session]);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    };

    void initialize();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      await refreshStatus();
      if (cancelled) return;
    };
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [refreshStatus]);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setIsPro(false);
    setDaysLeft(0);
    setProExpiresAt(null);
  };

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email || '',
        name: String(session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'),
      }
    : null;

  return (
    <UserContext.Provider value={{ user, session, loading, isPro, daysLeft, proExpiresAt, refreshStatus, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);

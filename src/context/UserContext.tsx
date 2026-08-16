'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UserContextType {
  isPro: boolean;
  daysLeft: number;
  dailyQuota: number;
  maxDailyQuota: number;
  consumeQuota: () => boolean;
  checkStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  isPro: false,
  daysLeft: 0,
  dailyQuota: 3,
  maxDailyQuota: 3,
  consumeQuota: () => true,
  checkStatus: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isPro, setIsPro] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const maxDailyQuota = 3; // Kuota 3x per hari untuk user free
  const [dailyQuota, setDailyQuota] = useState(maxDailyQuota);

  useEffect(() => {
    // Reset kuota setiap hari baru
    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('nexora_quota_date');
    const storedQuota = localStorage.getItem('nexora_daily_quota');

    if (storedDate !== today) {
      localStorage.setItem('nexora_quota_date', today);
      localStorage.setItem('nexora_daily_quota', String(maxDailyQuota));
      setDailyQuota(maxDailyQuota);
    } else if (storedQuota !== null) {
      setDailyQuota(Number(storedQuota));
    }
  }, []);

  const consumeQuota = (): boolean => {
    if (isPro) return true;
    if (dailyQuota <= 0) return false;

    const next = dailyQuota - 1;
    setDailyQuota(next);
    localStorage.setItem('nexora_daily_quota', String(next));
    return true;
  };

  const checkStatus = async () => {
    if (session?.user?.email) {
      const cleanEmail = session.user.email.trim().toLowerCase();
      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_status', email: cleanEmail }),
        });
        const data = await res.json();
        if (data.isPro) {
          setIsPro(true);
          setDaysLeft(data.daysLeft || 30);
        } else {
          setIsPro(false);
          setDaysLeft(0);
        }
      } catch (err) {
        setIsPro(false);
      }
    } else {
      setIsPro(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [session?.user?.email]);

  return (
    <UserContext.Provider value={{ isPro, daysLeft, dailyQuota, maxDailyQuota, consumeQuota, checkStatus }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);

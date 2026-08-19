'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatPage = pathname === '/chat' || pathname.startsWith('/chat/') || pathname === '/nexora-ai/chat' || pathname.startsWith('/nexora-ai/chat/');

  if (isChatPage) return <main className="min-h-screen bg-[#050505]">{children}</main>;

  return <><Navbar /><main className="flex-1 bg-[#050505]">{children}</main><Footer /></>;
}

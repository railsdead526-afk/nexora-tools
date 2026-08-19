'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatPage = pathname === '/chat' || pathname.startsWith('/chat/');

  if (isChatPage) {
    return <main className="min-h-screen bg-slate-950">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-950">{children}</main>
      <Footer />
    </>
  );
}

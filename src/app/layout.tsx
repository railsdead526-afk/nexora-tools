import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import { UserProvider } from '@/context/UserContext';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://nexora-tools.vercel.app'),
  title: { default: 'Nexora Tools - Premium Online Tools', template: '%s | Nexora Tools' },
  description: 'Nexora Tools, kumpulan tools online cepat, praktis, dan premium untuk kebutuhan kreator.',
  keywords: ['nexora tools', 'online tools', 'nexora ai', 'pdf tools', 'image tools'],
  authors: [{ name: 'Nexora Team' }], creator: 'Nexora', publisher: 'Nexora Tools',
  openGraph: { title: 'Nexora Tools - Premium Online Tools', description: 'Tools online cepat, praktis, dan siap dipakai.', url: '/', siteName: 'Nexora Tools', images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'Nexora Tools' }], locale: 'id_ID', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Nexora Tools - Premium Online Tools', description: 'Tools online cepat, praktis, dan siap dipakai.', images: ['/og-image.svg'] },
  manifest: '/manifest.json', icons: { icon: '/icon.svg', apple: '/icon.svg' }, robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} bg-[#050505] text-zinc-100 min-h-screen flex flex-col antialiased`}>
        <UserProvider><AppShell>{children}</AppShell></UserProvider>
      </body>
    </html>
  );
}

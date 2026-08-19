import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';
import { UserProvider } from '@/context/UserContext';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://nexora-tools.vercel.app'),
  title: {
    default: 'Nexora Tools - All-in-One Online Tools Hub',
    template: '%s | Nexora Tools',
  },
  description: 'Kumpulan tools online yang cepat, ringan, dan praktis untuk dokumen, gambar, teks, QR, dan kebutuhan kreator.',
  keywords: [
    'tools online gratis',
    'foto ke pdf',
    'gmail alias generator',
    'uuid generator minecraft',
    'kompres foto',
    'qr code generator',
    'nexora tools',
  ],
  authors: [{ name: 'Nexora Team' }],
  creator: 'Nexora',
  publisher: 'Nexora Tools',
  openGraph: {
    title: 'Nexora Tools - All-in-One Online Tools Hub',
    description: 'Kumpulan tools online cepat, ringan, dan siap dipakai.',
    url: '/',
    siteName: 'Nexora Tools',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'Nexora Tools' }],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexora Tools - All-in-One Online Tools Hub',
    description: 'Kumpulan tools online cepat, ringan, dan siap dipakai.',
    images: ['/og-image.svg'],
  },
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white`}>
        <UserProvider>
          <AppShell>{children}</AppShell>
        </UserProvider>
      </body>
    </html>
  );
}

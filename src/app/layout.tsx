import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import { UserProvider } from '@/context/UserContext';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://nexora-tools.vercel.app'),
  title: {
    default: 'Nexora Tools - All-in-One Online Tools Hub',
    template: '%s | Nexora Tools',
  },
  description: 'Kumpulan tools serbaguna gratis berbasis browser & tools AI premium untuk produktivitas maksimal. Potong video shorts, ubah foto ke PDF resmi, generator Gmail, dan QR Code.',
  keywords: [
    'tools online gratis',
    'potong video shorts',
    'ai auto clipper indonesia',
    'foto ke pdf resmi',
    'gmail alias generator',
    'uuid generator minecraft',
    'kompres foto',
    'qr code generator',
    'nexora tools'
  ],
  authors: [{ name: 'Nexora Team' }],
  creator: 'Nexora',
  publisher: 'Nexora Tools',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Nexora Tools - All-in-One Online Tools Hub',
    description: 'Kumpulan tools serbaguna cepat, ringan, dan bertenaga AI. Gratis & siap pakai langsung di browser!',
    url: 'https://nexora-tools.vercel.app',
    siteName: 'Nexora Tools',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Nexora Tools Preview Banner',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexora Tools - All-in-One Online Tools Hub',
    description: 'Kumpulan tools serbaguna gratis berbasis browser & AI premium.',
    images: ['/og-image.svg'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white`}>
        <AuthProvider>
          <UserProvider>
            <Navbar />
            <main className="flex-1 bg-slate-950">
              {children}
            </main>
            <Footer />
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

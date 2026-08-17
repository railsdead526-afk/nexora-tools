export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'All' | 'Downloader' | 'Maker' | 'Dokumen' | 'Tools';
  slug: string;
  isPremium: boolean;
  iconName: 'video' | 'pen' | 'download-video' | 'pdf-img' | 'gmail' | 'key' | 'compress' | 'merge' | 'qr' | 'case';
  badge: string;
}

export const TOOLS_DATA: Tool[] = [
  {
    id: '1',
    name: 'TikTok & YouTube',
    description: 'Download video & audio tanpa watermark.',
    category: 'Downloader',
    slug: 'video-downloader',
    isPremium: false,
    iconName: 'download-video',
    badge: 'MP4/MP3',
  },
  {
    id: '2',
    name: 'Naskah TikTok',
    description: 'Bikin skrip video 30s & hook affiliate.',
    category: 'Maker',
    slug: 'ai-copywriter',
    isPremium: true,
    iconName: 'pen',
    badge: 'PRO',
  },
  {
    id: '3',
    name: 'Foto ke PDF',
    description: 'Ubah foto KTP & Ijazah jadi PDF A4.',
    category: 'Dokumen',
    slug: 'image-to-pdf',
    isPremium: false,
    iconName: 'pdf-img',
    badge: 'PDF',
  },
  {
    id: '4',
    name: 'Gmail Alias',
    description: 'Bikin banyak email dari 1 akun Gmail.',
    category: 'Maker',
    slug: 'gmail-generator',
    isPremium: false,
    iconName: 'gmail',
    badge: 'ALIAS',
  },
  {
    id: '5',
    name: 'UUID Generator',
    description: 'Kode UUID unik & manifest Minecraft.',
    category: 'Tools',
    slug: 'uuid-generator',
    isPremium: false,
    iconName: 'key',
    badge: 'DEV',
  },
  {
    id: '6',
    name: 'Kompres Foto',
    description: 'Kecilkan file gambar tanpa bikin pecah.',
    category: 'Tools',
    slug: 'image-compressor',
    isPremium: false,
    iconName: 'compress',
    badge: 'HD',
  },
  {
    id: '7',
    name: 'Gabung PDF',
    description: 'Satukan file PDF jadi satu dokumen.',
    category: 'Dokumen',
    slug: 'pdf-tools',
    isPremium: false,
    iconName: 'merge',
    badge: 'FILE',
  },
  {
    id: '8',
    name: 'QR Generator',
    description: 'Bikin barcode QR Code custom warna.',
    category: 'Maker',
    slug: 'qr-generator',
    isPremium: false,
    iconName: 'qr',
    badge: 'HD',
  },
  {
    id: '9',
    name: 'Format Huruf',
    description: 'Ubah teks besar/kecil & hitung kata.',
    category: 'Tools',
    slug: 'case-converter',
    isPremium: false,
    iconName: 'case',
    badge: 'TEXT',
  },
];

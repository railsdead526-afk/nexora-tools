export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'Image' | 'Text' | 'PDF' | 'Generator' | 'Video';
  slug: string;
  isPremium: boolean;
  iconName: 'pen' | 'download-video' | 'pdf-img' | 'gmail' | 'key' | 'compress' | 'merge' | 'qr' | 'case';
  badge?: string;
}

export const TOOLS_DATA: Tool[] = [
  {
    id: '1',
    name: 'Naskah & Hook TikTok',
    description: 'Bikin skrip video 30 detik, hook clickbait, & caption jualan affiliate otomatis.',
    category: 'Text',
    slug: 'ai-copywriter',
    isPremium: true,
    iconName: 'pen',
    badge: 'PRO / AI',
  },
  {
    id: '2',
    name: 'Download TikTok & YouTube',
    description: 'Unduh video YouTube & TikTok tanpa watermark kualitas HD hingga 4K jernih.',
    category: 'Video',
    slug: 'video-downloader',
    isPremium: false,
    iconName: 'download-video',
    badge: 'HOT',
  },
  {
    id: '3',
    name: 'Foto ke PDF Resmi',
    description: 'Ubah kumpulan foto KTP, Ijazah & CV jadi 1 file PDF ukuran A4.',
    category: 'PDF',
    slug: 'image-to-pdf',
    isPremium: false,
    iconName: 'pdf-img',
    badge: 'POPULAR',
  },
  {
    id: '4',
    name: 'Gmail Alias Maker',
    description: 'Bikin puluhan email baru dari 1 akun Gmail pakai trik titik & plus.',
    category: 'Generator',
    slug: 'gmail-generator',
    isPremium: false,
    iconName: 'gmail',
  },
  {
    id: '5',
    name: 'UUID & Add-on Maker',
    description: 'Buat kode UUID unik & template manifest.json untuk Add-on Minecraft.',
    category: 'Generator',
    slug: 'uuid-generator',
    isPremium: false,
    iconName: 'key',
  },
  {
    id: '6',
    name: 'Kompres Foto Kilat',
    description: 'Kecilkan ukuran file foto JPG/PNG tanpa bikin gambarnya pecah.',
    category: 'Image',
    slug: 'image-compressor',
    isPremium: false,
    iconName: 'compress',
  },
  {
    id: '7',
    name: 'Gabung File PDF',
    description: 'Satukan beberapa dokumen PDF terpisah jadi satu file yang rapi.',
    category: 'PDF',
    slug: 'pdf-tools',
    isPremium: false,
    iconName: 'merge',
  },
  {
    id: '8',
    name: 'Bikin QR Code Custom',
    description: 'Buat barcode QR link & WiFi dengan pilihan warna bebas resolusi HD.',
    category: 'Generator',
    slug: 'qr-generator',
    isPremium: false,
    iconName: 'qr',
  },
  {
    id: '9',
    name: 'Format Huruf & Kata',
    description: 'Ubah teks jadi huruf besar/kecil & hitung kata/karakter secara instan.',
    category: 'Text',
    slug: 'case-converter',
    isPremium: false,
    iconName: 'case',
  },
];

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
    name: 'Download TikTok & YouTube',
    description: 'Downloader video melalui worker terpisah dengan validasi server dan akses kualitas PRO.',
    category: 'Video',
    slug: 'video-downloader',
    isPremium: false,
    iconName: 'download-video',
    badge: 'BETA',
  },
  {
    id: '2',
    name: 'Foto ke PDF Resmi',
    description: 'Ubah kumpulan foto KTP, ijazah, dan CV menjadi satu PDF ukuran A4.',
    category: 'PDF',
    slug: 'image-to-pdf',
    isPremium: false,
    iconName: 'pdf-img',
    badge: 'POPULAR',
  },
  {
    id: '3',
    name: 'Gmail Alias Maker',
    description: 'Buat variasi alamat email dari satu akun Gmail dengan format titik dan plus.',
    category: 'Generator',
    slug: 'gmail-generator',
    isPremium: false,
    iconName: 'gmail',
  },
  {
    id: '4',
    name: 'UUID & Add-on Maker',
    description: 'Buat UUID unik dan template manifest.json untuk Add-on Minecraft.',
    category: 'Generator',
    slug: 'uuid-generator',
    isPremium: false,
    iconName: 'key',
  },
  {
    id: '5',
    name: 'Kompres Foto Kilat',
    description: 'Kecilkan ukuran JPG, PNG, atau WebP langsung dari browser.',
    category: 'Image',
    slug: 'image-compressor',
    isPremium: false,
    iconName: 'compress',
  },
  {
    id: '6',
    name: 'Gabung File PDF',
    description: 'Satukan beberapa dokumen PDF menjadi satu file yang rapi.',
    category: 'PDF',
    slug: 'pdf-tools',
    isPremium: false,
    iconName: 'merge',
  },
  {
    id: '7',
    name: 'Bikin QR Code Custom',
    description: 'Buat QR untuk link atau Wi-Fi dan unduh hasilnya.',
    category: 'Generator',
    slug: 'qr-generator',
    isPremium: false,
    iconName: 'qr',
  },
  {
    id: '8',
    name: 'Format Huruf & Kata',
    description: 'Ubah format teks serta hitung kata dan karakter secara instan.',
    category: 'Text',
    slug: 'case-converter',
    isPremium: false,
    iconName: 'case',
  },
];

# Nexora Tools

Nexora Tools adalah aplikasi Next.js untuk kumpulan utilitas web dengan autentikasi Supabase dan sistem Nexora PRO otomatis melalui Midtrans.

## Fondasi utama

- Next.js App Router
- Supabase Auth
- Supabase Postgres untuk profil, subscription, payment, feedback, dan usage
- Midtrans Snap untuk pembayaran PRO otomatis
- Webhook Midtrans untuk aktivasi PRO selama 30 hari
- Downloader dipisahkan ke worker eksternal; Vercel hanya menjadi API proxy

## Setup

1. Install dependency:

```bash
npm install
```

2. Salin environment:

```bash
cp .env.example .env.local
```

3. Isi `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MIDTRANS_SERVER_KEY=
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_MERCHANT_ID=
DOWNLOADER_WORKER_URL=
DOWNLOADER_WORKER_TOKEN=
```

4. Jalankan SQL pada folder `supabase/migrations/` secara berurutan di Supabase SQL Editor.

5. Aktifkan Email/Password di Supabase Auth.

6. Buat akun Midtrans dan gunakan Server Key Sandbox untuk pengujian. Aktifkan metode pembayaran yang ingin ditampilkan di checkout Snap.

7. Untuk production, atur Payment Notification URL Midtrans ke:

```text
https://DOMAIN-KAMU/api/payments/midtrans/webhook
```

8. Opsional tapi disarankan: set `CRON_SECRET` lalu panggil `POST /api/internal/subscriptions/reconcile` secara terjadwal untuk merapikan subscription yang sudah lewat masa aktif.

9. Jalankan:

```bash
npm run dev
```

## Environment variables: lokal vs production

Variabel environment disimpan di dua tempat yang berbeda:

| Lingkungan | Sumber | Kapan dipakai |
|---|---|---|
| Lokal (`npm run dev`) | File `.env.local` | Saat develop di komputer sendiri |
| Production (Vercel) | Vercel → Settings → Environment Variables | Saat build dan runtime di server |

Poin penting:

- File `.env*` sengaja di-gitignore sehingga tidak pernah ter-upload ke repo. **Jangan pernah commit file `.env`** karena berisi kunci rahasia level server (`SUPABASE_SERVICE_ROLE_KEY`, `MIDTRANS_SERVER_KEY`).
- Vercel tidak membaca file `.env` dari repo; variabel production wajib diatur di dashboard Vercel (atau lewat CLI).
- Sinkronkan dari Vercel ke lokal tanpa copy-paste manual:

```bash
npm i -g vercel
vercel link                  # sekali saja per project
vercel env pull .env.local   # tarik semua variabel dari Vercel ke .env.local
vercel env add NAMA_VARIABEL production   # tambah variabel baru di Vercel dari terminal
```

- Variabel berprefix `NEXT_PUBLIC_` di-bake ke bundle browser saat build. Jika nilainya diubah di Vercel, jalankan redeploy supaya perubahan terlihat.
- Setelah penghapusan NexoraAI, variabel `OPENAI_API_KEY`, `ADMIN_EMAILS`, dan `ADMIN_USER_IDS` sudah tidak dipakai dan aman dihapus dari Vercel.

## Alur PRO

```text
User login
  -> pilih Nexora PRO
  -> backend membuat transaksi Midtrans
  -> user menyelesaikan checkout Midtrans
  -> Midtrans mengirim webhook
  -> signature diverifikasi
  -> payment ditandai paid
  -> subscription PRO aktif/ditambah 30 hari
  -> UI membaca status PRO dari server
```

Tidak ada lagi pembayaran DANA manual, upload bukti transfer, atau aktivasi PRO manual.

## Catatan penghapusan NexoraAI

Fitur NexoraAI (AI chat, riwayat percakapan, RAG knowledge base, dan admin knowledge base) telah dihapus dari aplikasi. Migration `009_remove_nexora_ai.sql` tersedia untuk membersihkan tabel (`ai_conversations`, `ai_messages`, `knowledge_documents`, `knowledge_chunks`), fungsi pendukung, dan storage bucket `knowledge-base` dari database Supabase. Jalankan migration tersebut jika database sudah pernah menjalankan migration 006/007.

## Catatan downloader

Downloader lama yang menjalankan `yt-dlp` langsung dari route Vercel telah dibuang. Route `/api/downloader` sekarang hanya meneruskan request ke worker eksternal yang dikonfigurasi melalui `DOWNLOADER_WORKER_URL`. Jika worker belum tersedia, downloader mengembalikan status nonaktif dengan aman.

# Nexora Tools

Nexora Tools adalah aplikasi Next.js untuk kumpulan utilitas web dengan autentikasi Supabase, AI chat berbasis OpenAI, fondasi RAG berbasis Supabase Storage + pgvector, dan sistem Nexora PRO otomatis melalui Midtrans.

## Fondasi utama

- Next.js App Router
- Supabase Auth
- Supabase Postgres untuk profil, subscription, payment, feedback, usage, percakapan AI, dan knowledge base
- OpenAI Chat + OpenAI Embeddings
- RAG foundation dengan Supabase Storage + pgvector
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
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
MIDTRANS_SERVER_KEY=
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_MERCHANT_ID=
DOWNLOADER_WORKER_URL=
DOWNLOADER_WORKER_TOKEN=
ADMIN_EMAILS=
ADMIN_USER_IDS=
```

4. Jalankan SQL pada folder `supabase/migrations/` secara berurutan di Supabase SQL Editor.

5. Aktifkan Email/Password di Supabase Auth.

6. Buat akun Midtrans dan gunakan Server Key Sandbox untuk pengujian. Aktifkan metode pembayaran yang ingin ditampilkan di checkout Snap.

7. Untuk production, atur Payment Notification URL Midtrans ke:

```text
https://DOMAIN-KAMU/api/payments/midtrans/webhook
```

8. Siapkan knowledge base bucket bernama `knowledge-base` jika belum dibuat oleh migration, lalu gunakan akun admin untuk upload dokumen knowledge base.

9. Opsional tapi disarankan: set `CRON_SECRET` lalu panggil `POST /api/internal/subscriptions/reconcile` secara terjadwal untuk merapikan subscription yang sudah lewat masa aktif.

10. Jalankan:

```bash
npm run dev
```

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

## Alur AI + RAG

```text
Admin upload dokumen knowledge base
  -> file masuk ke Supabase Storage
  -> backend ekstrak teks, chunking, embedding OpenAI
  -> chunk disimpan ke pgvector
  -> user chat ke NexoraAI
  -> backend ambil konteks knowledge base terkait
  -> model OpenAI menjawab dengan konteks + tool search_knowledge bila diperlukan
```

## Catatan downloader

Downloader lama yang menjalankan `yt-dlp` langsung dari route Vercel telah dibuang. Route `/api/downloader` sekarang hanya meneruskan request ke worker eksternal yang dikonfigurasi melalui `DOWNLOADER_WORKER_URL`. Jika worker belum tersedia, downloader mengembalikan status nonaktif dengan aman.

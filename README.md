# Nexora Tools

Nexora Tools adalah aplikasi Next.js untuk kumpulan utilitas web dengan autentikasi Supabase dan sistem Nexora PRO otomatis melalui Midtrans QRIS.

## Fondasi utama

- Next.js App Router
- Supabase Auth
- Supabase Postgres untuk profil, subscription, payment, feedback, dan usage
- Midtrans Snap QRIS untuk pembayaran PRO otomatis
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
DOWNLOADER_WORKER_URL=
DOWNLOADER_WORKER_TOKEN=
```

4. Jalankan SQL pada `supabase/migrations/001_initial.sql` di Supabase SQL Editor.

5. Aktifkan Email/Password di Supabase Auth.

6. Buat akun Midtrans dan gunakan Server Key Sandbox untuk pengujian. Aktifkan QRIS/GoPay atau Other QRIS pada merchant Midtrans.

7. Untuk production, atur Payment Notification URL Midtrans ke:

```text
https://DOMAIN-KAMU/api/payments/midtrans/webhook
```

8. Jalankan:

```bash
npm run dev
```

## Alur PRO

```text
User login
  -> pilih Nexora PRO
  -> backend membuat transaksi Midtrans
  -> user membayar QRIS
  -> Midtrans mengirim webhook
  -> signature diverifikasi
  -> payment ditandai paid
  -> subscription PRO aktif/ditambah 30 hari
  -> UI membaca status PRO dari server
```

Tidak ada lagi PIN admin, voucher universal, `pro_users.json`, atau aktivasi PRO manual.

## Catatan downloader

Downloader lama yang menjalankan `yt-dlp` langsung dari route Vercel telah dibuang. Route `/api/downloader` sekarang hanya meneruskan request ke worker eksternal yang dikonfigurasi melalui `DOWNLOADER_WORKER_URL`. Jika worker belum tersedia, downloader mengembalikan status nonaktif dengan aman.

# Nexora Tools

Nexora Tools adalah aplikasi Next.js untuk kumpulan utilitas web dengan autentikasi Supabase dan sistem Nexora PRO berbasis pembayaran manual.

## Fondasi utama

- Next.js App Router
- Supabase Auth
- Supabase Postgres untuk profil, subscription, payment, feedback, dan usage
- Pembayaran manual melalui transfer bank atau e-wallet
- Upload bukti ke private storage bucket dan review admin
- Aktivasi PRO selama 30 hari sejak pembayaran disetujui
- Downloader dipisahkan ke worker eksternal; Vercel hanya menjadi API proxy

## Setup

1. Install dependency:

```bash
npm ci
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
MANUAL_PAYMENT_METHOD=Transfer bank / e-wallet manual
MANUAL_PAYMENT_ACCOUNT_NAME=
MANUAL_PAYMENT_ACCOUNT_NUMBER=
MANUAL_PAYMENT_INSTRUCTIONS=Transfer sesuai nominal, simpan bukti pembayaran, lalu unggah bukti pada formulir ini.
MANUAL_PAYMENT_ADMIN_EMAILS=
MANUAL_PAYMENT_ADMIN_USER_IDS=
DOWNLOADER_WORKER_URL=
DOWNLOADER_WORKER_TOKEN=
CRON_SECRET=
```

4. Jalankan SQL pada folder `supabase/migrations/` secara berurutan di Supabase SQL Editor. Migration `010_manual_payment_flow.sql` membuat bucket private `payment-proofs`, RPC order idempotent, dan RPC review/activation. Uji migration pada project Supabase staging terlebih dahulu.

5. Aktifkan Email/Password di Supabase Auth.

6. Pastikan `MANUAL_PAYMENT_ACCOUNT_NUMBER` diisi dengan rekening atau akun e-wallet milik operator. Jangan memasukkan nomor rekening ke source code atau variable `NEXT_PUBLIC_*`.

7. Isi `MANUAL_PAYMENT_ADMIN_EMAILS` dengan email admin yang dipisahkan koma, atau `MANUAL_PAYMENT_ADMIN_USER_IDS` dengan UUID user admin. Minimal satu allowlist harus diisi sebelum review pembayaran digunakan.

8. Untuk production, atur `NEXT_PUBLIC_APP_URL` ke domain HTTPS dan jalankan rekonsiliasi expiry melalui scheduler yang mengirim:

```text
POST https://DOMAIN-KAMU/api/internal/subscriptions/reconcile
Authorization: Bearer CRON_SECRET
```

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

File `.env*` sengaja di-gitignore sehingga tidak pernah ter-upload ke repository. **Jangan pernah commit file `.env`** karena berisi `SUPABASE_SERVICE_ROLE_KEY` dan konfigurasi rekening/admin.

Variabel berprefix `NEXT_PUBLIC_` di-bake ke bundle browser saat build. Informasi rekening manual tidak memakai prefix tersebut dan hanya dikirim oleh endpoint pembayaran yang telah diautentikasi.

## Alur pembayaran manual

```text
User login
  -> pilih Nexora PRO
  -> server membuat atau mengembalikan satu order manual terbuka
  -> user melihat instruksi transfer
  -> user transfer dan upload JPG/PNG/PDF maksimal 5 MB
  -> bukti disimpan ke bucket private
  -> payment menjadi pending_review
  -> admin membuka /admin/payments dan memeriksa bukti
  -> admin approve atau reject
  -> approve mengubah payment menjadi paid dan mengaktifkan PRO 30 hari
  -> scheduler merekonsiliasi subscription yang sudah expired
```

Masa PRO **tidak dimulai ketika order dibuat atau ketika bukti di-upload**. Masa aktif dimulai ketika admin menekan approve. Jika akun masih memiliki PRO aktif, 30 hari baru ditambahkan dari expiry yang sedang berjalan; jika sudah expired, 30 hari dimulai dari waktu approval.

Endpoint admin hanya menerima user yang email atau UUID-nya terdaftar pada `MANUAL_PAYMENT_ADMIN_EMAILS` atau `MANUAL_PAYMENT_ADMIN_USER_IDS`. Bukti pembayaran tidak dibuat public; dashboard admin menerima signed URL sementara untuk pemeriksaan.

## Test dan quality gate

```bash
npm run lint
npm run typecheck
npm test
npm run build
python3 -m py_compile downloader-worker/app.py
pip-audit -r downloader-worker/requirements.txt
```

## Catatan penghapusan NexoraAI

Fitur NexoraAI (AI chat, riwayat percakapan, RAG knowledge base, dan admin knowledge base) telah dihapus dari aplikasi. Migration `009_remove_nexora_ai.sql` membersihkan tabel (`ai_conversations`, `ai_messages`, `knowledge_documents`, `knowledge_chunks`), fungsi pendukung, dan storage bucket `knowledge-base` dari database. Migration ini bersifat destruktif; lakukan backup dan uji restore sebelum menjalankannya pada database nyata.

## Catatan downloader

Downloader lama yang menjalankan `yt-dlp` langsung dari route Vercel telah dibuang. Route `/api/downloader` hanya meneruskan request ke worker eksternal yang dikonfigurasi melalui `DOWNLOADER_WORKER_URL`. Semua action harus diautentikasi dan worker memerlukan `WORKER_TOKEN`. Jika worker belum tersedia, downloader mengembalikan status nonaktif dengan aman.

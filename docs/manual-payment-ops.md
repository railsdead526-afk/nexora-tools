# Runbook Pembayaran Manual

Pembayaran manual digunakan sementara selama provider pembayaran otomatis belum selesai ditinjau. Alur ini tidak mengaktifkan PRO saat user membuat order atau mengunggah bukti. PRO hanya aktif setelah admin menyetujui bukti pembayaran.

## Konfigurasi sekali saja

Isi environment server berikut pada Vercel atau runtime production:

```env
MANUAL_PAYMENT_METHOD=Transfer bank / e-wallet manual
MANUAL_PAYMENT_ACCOUNT_NAME=Nama pemilik rekening
MANUAL_PAYMENT_ACCOUNT_NUMBER=Nomor rekening atau akun e-wallet
MANUAL_PAYMENT_INSTRUCTIONS=Transfer sesuai nominal dan unggah bukti pembayaran.
MANUAL_PAYMENT_ADMIN_EMAILS=admin@example.com
MANUAL_PAYMENT_ADMIN_USER_IDS=
CRON_SECRET=random-secret-panjang
```

Jangan memakai prefix `NEXT_PUBLIC_` untuk nomor rekening, daftar admin, atau secret. Setelah mengisi environment, jalankan redeploy.

## Migration database

Jalankan migration secara berurutan pada Supabase staging, lalu production:

```text
supabase/migrations/010_manual_payment_flow.sql
```

Migration tersebut membuat private bucket `payment-proofs`, provider `manual_bank`, order manual idempotent, serta RPC review yang hanya dapat dipanggil oleh `service_role`. Sebelum migration pada database nyata, lakukan backup.

## Proses user

User login, membuka pricing, memilih Nexora PRO, lalu mendapatkan order manual. Sistem akan mengembalikan order terbuka terbaru jika user melakukan klik ulang. User transfer sesuai nominal, mengunggah satu file JPG/PNG/PDF maksimal 5 MB, dan melihat status `pending_review`.

## Proses admin

Admin login memakai email atau UUID yang telah masuk allowlist. Buka `/admin/payments`, buka signed URL bukti yang tersedia, dan cocokkan nama, nominal, waktu, serta rekening tujuan dengan transaksi bank/e-wallet. Tekan **Setujui** hanya setelah uang benar-benar masuk. Tekan **Tolak** bila bukti tidak valid dan minta user mengirim order baru.

Saat approve, database transaction mengubah payment menjadi `paid` dan menetapkan subscription menjadi `pro/active`. Jika user tidak sedang memiliki PRO aktif, expiry menjadi waktu approval ditambah 30 hari. Jika user masih aktif, 30 hari ditambahkan dari expiry lama agar sisa masa aktif tidak hilang.

## Expiry otomatis

Jadwalkan request berikut minimal sekali sehari:

```text
POST /api/internal/subscriptions/reconcile
Authorization: Bearer CRON_SECRET
```

Endpoint tersebut mengubah subscription `pro/active` yang `expires_at <= now()` menjadi `free/expired`. Selain scheduler, aplikasi juga menghitung `expires_at` secara read-only sehingga akses tidak tetap dianggap PRO setelah waktu expiry terlewati meskipun scheduler terlambat.

## Rekonsiliasi dan audit

Jangan menghapus row payment yang sudah disetujui. Gunakan `provider_order_id`, `submitted_at`, `reviewed_at`, `reviewed_by`, dan `review_note` sebagai jejak audit. Jika bukti perlu diganti, user dapat upload ulang pada order yang sama selama belum `paid`.

Pembayaran manual adalah solusi operasional sementara. Setelah volume transaksi meningkat, siapkan rekonsiliasi bank, kebijakan refund, dan provider pembayaran yang telah menyelesaikan proses review bisnis sebelum mengotomatisasi kembali.

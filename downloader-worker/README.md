# Nexora Downloader Worker

Worker terpisah untuk Nexora Tools. Worker menjalankan `yt-dlp` dan FFmpeg di container, hanya menerima URL YouTube/TikTok, serta dilindungi bearer token.

## Render

- Service type: Web Service
- Runtime/Language: Docker
- Root Directory: `downloader-worker`
- Health Check Path: `/health`
- Environment: `WORKER_TOKEN=<secret panjang acak>`
- Environment: `PUBLIC_BASE_URL=https://NAMA-SERVICE.onrender.com`
- Instance: Free untuk testing; evaluasi timeout dan kapasitas sebelum traffic nyata

`PUBLIC_BASE_URL` wajib diisi agar URL file tidak dibentuk dari Host request. Hasil download menggunakan token URL sementara dan dihapus setelah TTL.

Setelah service Ready, set di Vercel Nexora:

- `DOWNLOADER_WORKER_URL=https://NAMA-SERVICE.onrender.com/api/downloader`
- `DOWNLOADER_WORKER_TOKEN=<secret yang sama>`

Semua action downloader dipanggil melalui session user dan rate limit aplikasi. Gunakan hanya untuk konten yang Anda miliki atau memiliki izin untuk mengunduhnya.

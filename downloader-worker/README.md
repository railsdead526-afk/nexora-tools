# Nexora Downloader Worker

Worker terpisah untuk Nexora Tools. Menjalankan yt-dlp + ffmpeg di container dan hanya menerima YouTube/TikTok.

## Render

- Service type: Web Service
- Runtime/Language: Docker
- Root Directory: `downloader-worker`
- Health Check Path: `/health`
- Environment: `WORKER_TOKEN=<secret panjang acak>`
- Instance: Free untuk testing

Setelah service Ready, set di Vercel Nexora:

- `DOWNLOADER_WORKER_URL=https://NAMA-SERVICE.onrender.com/api/downloader`
- `DOWNLOADER_WORKER_TOKEN=<secret yang sama>`

Gunakan hanya untuk konten yang Anda miliki atau memiliki izin untuk mengunduhnya.

from __future__ import annotations

import asyncio
import hmac
import logging
import os
import re
import shutil
import time
import uuid
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import yt_dlp

APP_LOG = logging.getLogger("nexora.downloader")
APP_LOG.setLevel(logging.INFO)

APP_NAME = "Nexora Downloader Worker"
TMP_ROOT = Path(os.getenv("DOWNLOAD_TMP_DIR", "/tmp/nexora-downloads"))
MAX_DURATION_SECONDS = int(os.getenv("MAX_VIDEO_DURATION_SECONDS", "1200"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "250"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
FILE_TTL_SECONDS = int(os.getenv("FILE_TTL_SECONDS", "1800"))
WORKER_TOKEN = os.getenv("WORKER_TOKEN", "").strip()
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "").strip().rstrip("/")
MAX_CONCURRENT_DOWNLOADS = max(1, int(os.getenv("MAX_CONCURRENT_DOWNLOADS", "1")))

TMP_ROOT.mkdir(parents=True, exist_ok=True)
DOWNLOAD_SEMAPHORE = asyncio.Semaphore(MAX_CONCURRENT_DOWNLOADS)

ALLOWED_RESOLUTIONS = {"360", "720", "1080", "1440", "2160", "mp3"}

app = FastAPI(title=APP_NAME, version="1.0.0")


class DownloaderRequest(BaseModel):
    action: Literal["get_info", "download_file"]
    url: str
    resolution: str = "720"
    isAudio: bool = False


class WorkerError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int,
        code: str,
        retryable: bool = False,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.retryable = retryable


class YtDlpLogger:
    def __init__(self) -> None:
        self.errors: list[str] = []

    def debug(self, msg: str) -> None:
        return None

    def warning(self, msg: str) -> None:
        return None

    def error(self, msg: str) -> None:
        self.errors.append(msg)


def safe_error_for_log(message: object) -> str:
    text = str(message)

    # Jangan bocorkan URL bertoken/signature dari CDN.
    text = re.sub(r"https?://\S+", "<url>", text)

    # Jangan bocorkan token/cookie/authorization jika muncul di exception.
    text = re.sub(
        r"(?i)(authorization|bearer|token|cookie)(\s*[:=]\s*|\s+)\S+",
        r"\1=<redacted>",
        text,
    )

    # Path file temporary tidak perlu muncul di log produksi.
    text = re.sub(r"/tmp/\S+", "<tmp-path>", text)

    text = re.sub(r"\s+", " ", text).strip()
    return text[:1000]


def require_worker_token(authorization: str | None) -> None:
    if not WORKER_TOKEN:
        raise HTTPException(status_code=503, detail="WORKER_TOKEN belum dikonfigurasi.")

    expected = f"Bearer {WORKER_TOKEN}"
    if not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Worker token tidak valid.")


def is_allowed_video_url(raw_url: str) -> bool:
    try:
        parsed = urlparse(raw_url)
        if parsed.scheme not in {"http", "https"}:
            return False
        host = (parsed.hostname or "").lower().rstrip(".")
        return (
            host == "youtu.be"
            or host == "youtube.com"
            or host.endswith(".youtube.com")
            or host == "tiktok.com"
            or host.endswith(".tiktok.com")
        )
    except Exception:
        return False


def cleanup_stale_files() -> None:
    now = time.time()
    if not TMP_ROOT.exists():
        return

    for item in TMP_ROOT.iterdir():
        try:
            if now - item.stat().st_mtime > FILE_TTL_SECONDS:
                if item.is_dir():
                    shutil.rmtree(item, ignore_errors=True)
                else:
                    item.unlink(missing_ok=True)
        except OSError:
            continue


def format_duration(value: object) -> str:
    try:
        total = int(float(value or 0))
    except (TypeError, ValueError):
        return "--:--"

    hours, rem = divmod(total, 3600)
    minutes, seconds = divmod(rem, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"


def common_ydl_options(logger: YtDlpLogger) -> dict:
    return {
        "quiet": True,
        "no_warnings": True,
        "logger": logger,
        "noplaylist": True,
        "cachedir": False,
        "socket_timeout": 20,
        "retries": 3,
        "fragment_retries": 3,
        "extractor_retries": 2,
        "concurrent_fragment_downloads": 2,
        # yt-dlp 2026 membutuhkan JS runtime + EJS untuk dukungan YouTube penuh.
        "js_runtimes": {"node": {}},
    }


def extract_info(raw_url: str) -> dict:
    logger = YtDlpLogger()
    options = common_ydl_options(logger)
    options.update({"skip_download": True})

    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            info = ydl.extract_info(raw_url, download=False)
    except Exception as exc:
        message = logger.errors[-1] if logger.errors else str(exc)

        APP_LOG.warning(
            "yt-dlp extract_info failed host=%s detail=%s",
            (urlparse(raw_url).hostname or "unknown").lower(),
            safe_error_for_log(message),
        )

        raise worker_error_from_message(message) from exc

    if not isinstance(info, dict):
        raise WorkerError("Metadata video tidak ditemukan.", 502, "metadata_unavailable", True)

    duration = int(info.get("duration") or 0)
    if duration > MAX_DURATION_SECONDS:
        raise WorkerError(
            f"Durasi video terlalu panjang. Maksimum {MAX_DURATION_SECONDS // 60} menit untuk worker ini.",
            422,
            "duration_limit",
        )

    webpage_url = str(info.get("webpage_url") or raw_url)
    host = (urlparse(webpage_url).hostname or "").lower()

    return {
        "raw": info,
        "title": str(info.get("title") or "Video"),
        "thumbnail": str(info.get("thumbnail") or ""),
        "duration": format_duration(duration),
        "durationSeconds": duration,
        "uploader": str(info.get("uploader") or info.get("channel") or "Unknown"),
        "isTikTok": "tiktok" in host,
    }


def video_format_selector(height: int) -> str:
    # Utamakan MP4 + M4A agar hasil gabungan ramah Android/browser.
    return (
        f"bv*[height<=?{height}][ext=mp4]+ba[ext=m4a]/"
        f"b[height<=?{height}][ext=mp4]/"
        f"bv*[height<=?{height}]+ba/b[height<=?{height}]/b"
    )


def worker_error_from_message(message: object) -> WorkerError:
    text = re.sub(r"\s+", " ", str(message)).strip()
    lowered = text.lower()

    if (
        "sign in to confirm" in lowered
        or "not a bot" in lowered
        or "captcha" in lowered
    ):
        return WorkerError(
            "YouTube sementara menolak akses dari server. Coba lagi nanti atau gunakan sumber video lain.",
            503,
            "upstream_auth_required",
            True,
        )

    if "private video" in lowered or "video unavailable" in lowered:
        return WorkerError(
            "Video tidak tersedia atau tidak bersifat publik.",
            404,
            "video_unavailable",
        )

    if "unsupported url" in lowered:
        return WorkerError(
            "URL ini belum didukung oleh downloader.",
            400,
            "unsupported_url",
        )

    if "requested format is not available" in lowered:
        return WorkerError(
            "Kualitas yang dipilih tidak tersedia untuk video ini.",
            400,
            "format_unavailable",
        )

    if "timed out" in lowered or "timeout" in lowered:
        return WorkerError(
            "Sumber video tidak merespons tepat waktu. Coba lagi.",
            504,
            "upstream_timeout",
            True,
        )

    if (
        "429" in lowered
        or "too many requests" in lowered
        or "rate limit" in lowered
    ):
        return WorkerError(
            "Sumber video sedang membatasi terlalu banyak permintaan. Coba lagi nanti.",
            503,
            "upstream_rate_limited",
            True,
        )

    if "403" in lowered or "forbidden" in lowered:
        return WorkerError(
            "Sumber video menolak permintaan dari server.",
            502,
            "upstream_forbidden",
            True,
        )

    return WorkerError(
        "Sumber video gagal diproses oleh worker.",
        502,
        "upstream_error",
        True,
    )


def download_media(raw_url: str, resolution: str, is_audio: bool) -> tuple[Path, Path]:
    job_dir = TMP_ROOT / uuid.uuid4().hex
    job_dir.mkdir(parents=True, exist_ok=False)
    logger = YtDlpLogger()

    try:
        metadata = extract_info(raw_url)
        output_template = str(job_dir / "media.%(ext)s")

        options = common_ydl_options(logger)
        options.update(
            {
                "outtmpl": output_template,
                "overwrites": True,
                "restrictfilenames": True,
                "max_filesize": MAX_FILE_SIZE_BYTES,
            }
        )

        if is_audio or resolution == "mp3":
            options.update(
                {
                    "format": "bestaudio/best",
                    "postprocessors": [
                        {
                            "key": "FFmpegExtractAudio",
                            "preferredcodec": "mp3",
                            "preferredquality": "192",
                        }
                    ],
                }
            )
        else:
            height = int(resolution)
            options.update(
                {
                    "format": video_format_selector(height),
                    "merge_output_format": "mp4",
                }
            )

        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([raw_url])

        candidates = [
            path
            for path in job_dir.iterdir()
            if path.is_file() and path.suffix not in {".part", ".ytdl"}
        ]
        if not candidates:
            raise WorkerError("File hasil download tidak ditemukan.", 502, "output_missing", True)

        file_path = max(candidates, key=lambda path: path.stat().st_size)
        if file_path.stat().st_size > MAX_FILE_SIZE_BYTES:
            raise WorkerError(f"Ukuran file melebihi batas {MAX_FILE_SIZE_MB} MB.", 413, "file_too_large")

        safe_title = re.sub(r"[^A-Za-z0-9._ -]+", "", metadata["title"]).strip()[:80] or "nexora-video"
        final_name = f"{safe_title}{file_path.suffix.lower()}"
        final_path = job_dir / final_name
        if file_path != final_path:
            file_path.rename(final_path)

        return job_dir, final_path
    except WorkerError:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise
    except Exception as exc:
        shutil.rmtree(job_dir, ignore_errors=True)
        message = logger.errors[-1] if logger.errors else str(exc)

        APP_LOG.warning(
            "yt-dlp download failed host=%s detail=%s",
            (urlparse(raw_url).hostname or "unknown").lower(),
            safe_error_for_log(message),
        )

        raise worker_error_from_message(message) from exc


@app.get("/health")
def health() -> dict:
    cleanup_stale_files()
    return {
        "ok": True,
        "service": APP_NAME,
        "maxDurationMinutes": MAX_DURATION_SECONDS // 60,
        "maxFileSizeMb": MAX_FILE_SIZE_MB,
    }


@app.post("/api/downloader")
async def downloader(
    payload: DownloaderRequest,
    request: Request,
    authorization: str | None = Header(default=None),
):
    require_worker_token(authorization)
    cleanup_stale_files()

    raw_url = payload.url.strip()
    resolution = payload.resolution.strip().lower()

    if not is_allowed_video_url(raw_url):
        return JSONResponse({"success": False, "error": "URL video tidak didukung."}, status_code=400)

    if resolution not in ALLOWED_RESOLUTIONS:
        return JSONResponse({"success": False, "error": "Resolusi tidak valid."}, status_code=400)

    try:
        if payload.action == "get_info":
            metadata = await run_in_threadpool(extract_info, raw_url)
            metadata.pop("raw", None)
            return {"success": True, **metadata}

        async with DOWNLOAD_SEMAPHORE:
            job_dir, file_path = await run_in_threadpool(
                download_media,
                raw_url,
                resolution,
                payload.isAudio or resolution == "mp3",
            )

        base_url = PUBLIC_BASE_URL or str(request.base_url).rstrip("/")
        download_url = f"{base_url}/files/{job_dir.name}/{file_path.name}"
        return {
            "success": True,
            "downloadUrl": download_url,
            "filename": file_path.name,
            "sizeBytes": file_path.stat().st_size,
        }
    except WorkerError as exc:
        return JSONResponse(
            {
                "success": False,
                "error": str(exc),
                "code": exc.code,
                "retryable": exc.retryable,
            },
            status_code=exc.status_code,
        )
    except Exception as exc:
        APP_LOG.error(
            "Unhandled downloader error type=%s detail=%s",
            type(exc).__name__,
            safe_error_for_log(exc),
        )
        return JSONResponse(
            {
                "success": False,
                "error": "Worker mengalami kesalahan internal.",
                "code": "internal_error",
                "retryable": False,
            },
            status_code=500,
        )


@app.get("/files/{job_id}/{filename}")
def serve_file(job_id: str, filename: str):
    if not re.fullmatch(r"[a-f0-9]{32}", job_id):
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")

    job_dir = (TMP_ROOT / job_id).resolve()
    file_path = (job_dir / filename).resolve()
    root = TMP_ROOT.resolve()

    if root not in file_path.parents or job_dir != file_path.parent:
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File sudah kedaluwarsa atau tidak ditemukan.")

    media_type = "audio/mpeg" if file_path.suffix.lower() == ".mp3" else "video/mp4"
    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type=media_type,
    )

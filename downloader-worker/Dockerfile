FROM node:22-bookworm-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN python3 -m venv /opt/venv
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY app.py ./app.py

EXPOSE 10000
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-10000} --workers 1"]

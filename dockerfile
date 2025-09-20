# ---------- Backend (FastAPI) ----------
FROM python:3.11-slim AS backend

# Install system dependencies (needed for psycopg2)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---------- Frontend (React + Vite) ----------
FROM node:20 AS frontend

WORKDIR /frontend

# copy package files first for caching
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# copy rest of frontend files
COPY frontend/ .  

# build the React app
RUN npm run build

# ---------- Final Image ----------
FROM python:3.11-slim

WORKDIR /app

# Copy backend
# Copy Python packages and binaries from backend stage
COPY --from=backend /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=backend /usr/local/bin /usr/local/bin

# Copy backend code
COPY backend/ ./backend

# Copy built frontend (static files)
COPY --from=frontend /frontend/dist ./frontend/dist

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "-k", "uvicorn.workers.UvicornWorker", "backend.app:app"]

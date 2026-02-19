#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDFILE="$ROOT_DIR/.backend.pid"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

cleanup() {
  if [ -f "$PIDFILE" ]; then
    local pid
    pid=$(cat "$PIDFILE")
    if kill -0 "$pid" 2>/dev/null; then
      info "Stopping backend (PID $pid)..."
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
    rm -f "$PIDFILE"
  fi
}

trap cleanup EXIT INT TERM

# ── 1. Check prerequisites ──────────────────────────────────────────
for cmd in docker node npm; do
  if ! command -v "$cmd" &>/dev/null; then
    error "$cmd is required but not installed."
    exit 1
  fi
done

# ── 2. Set up .env if missing ────────────────────────────────────────
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  if [ -f "$ROOT_DIR/backend/.env.example" ]; then
    cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
    warn "Created backend/.env from .env.example — please update HF_API_KEY before querying."
  else
    error "No .env or .env.example found in backend/. Cannot continue."
    exit 1
  fi
fi

# ── 3. Start Docker (Weaviate + transformers) ───────────────────────
info "Starting Docker services (Weaviate + text2vec-transformers)..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d

info "Waiting for Weaviate to become healthy..."
MAX_WAIT=180
ELAPSED=0
until curl -sf http://localhost:8090/v1/.well-known/ready >/dev/null 2>&1; do
  if [ "$ELAPSED" -ge "$MAX_WAIT" ]; then
    error "Weaviate did not become healthy within ${MAX_WAIT}s."
    error "Check logs: docker compose logs"
    exit 1
  fi
  sleep 3
  ELAPSED=$((ELAPSED + 3))
  echo -n "."
done
echo ""
info "Weaviate is ready (took ~${ELAPSED}s)."

# ── 4. Install backend dependencies ─────────────────────────────────
if [ ! -d "$ROOT_DIR/backend/node_modules" ]; then
  info "Installing backend dependencies..."
  (cd "$ROOT_DIR/backend" && npm install)
else
  info "Backend dependencies already installed."
fi

# ── 5. Install frontend dependencies ────────────────────────────────
if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  info "Installing frontend dependencies..."
  (cd "$ROOT_DIR/frontend" && npm install)
else
  info "Frontend dependencies already installed."
fi

# ── 6. Build backend ────────────────────────────────────────────────
info "Building backend..."
(cd "$ROOT_DIR/backend" && npm run build)

# ── 7. Build frontend ───────────────────────────────────────────────
info "Building frontend..."
(cd "$ROOT_DIR/frontend" && npm run build)

# ── 8. Start backend (serves API + static frontend) ─────────────────
info "Starting backend server..."
(cd "$ROOT_DIR/backend" && node dist/index.js) &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PIDFILE"

sleep 2
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
  error "Backend failed to start. Check logs above."
  exit 1
fi

echo ""
info "============================================"
info "  RAG Application is running!"
info "  Open: http://localhost:3001"
info "  API:  http://localhost:3001/api/health"
info "============================================"
echo ""
info "Press Ctrl+C to stop."

wait "$BACKEND_PID"

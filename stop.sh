#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDFILE="$ROOT_DIR/.backend.pid"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }

# ── Stop backend ─────────────────────────────────────────────────────
if [ -f "$PIDFILE" ]; then
  PID=$(cat "$PIDFILE")
  if kill -0 "$PID" 2>/dev/null; then
    info "Stopping backend (PID $PID)..."
    kill "$PID" 2>/dev/null || true
    sleep 2
    if kill -0 "$PID" 2>/dev/null; then
      warn "Force-killing backend..."
      kill -9 "$PID" 2>/dev/null || true
    fi
    info "Backend stopped."
  else
    info "Backend process not running."
  fi
  rm -f "$PIDFILE"
else
  info "No backend PID file found."
fi

# ── Stop Docker ──────────────────────────────────────────────────────
info "Stopping Docker services..."
docker compose -f "$ROOT_DIR/docker-compose.yml" down

info "All services stopped."

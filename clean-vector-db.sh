#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
PIDFILE="$ROOT_DIR/.backend.pid"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

if ! command -v docker >/dev/null 2>&1; then
  error "docker is required but not installed."
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  error "docker-compose.yml not found at $COMPOSE_FILE"
  exit 1
fi

if [ "${1:-}" != "--yes" ]; then
  warn "This will permanently delete your vector database data."
  warn "It removes Docker volumes defined by this compose project (currently weaviate_data)."
  read -r -p "Continue? [y/N] " response
  case "$response" in
    y|Y|yes|YES)
      ;;
    *)
      info "Aborted. No data was deleted."
      exit 0
      ;;
  esac
fi

if [ -f "$PIDFILE" ]; then
  pid=$(cat "$PIDFILE")
  if kill -0 "$pid" 2>/dev/null; then
    info "Stopping backend process (PID $pid)..."
    kill "$pid" 2>/dev/null || true
    sleep 2
    if kill -0 "$pid" 2>/dev/null; then
      warn "Force-killing backend process..."
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
  rm -f "$PIDFILE"
fi

info "Stopping Docker services and removing vector DB volume data..."
docker compose -f "$COMPOSE_FILE" down -v --remove-orphans

info "Vector database cleanup complete."
info "Run ./start.sh to start with an empty Weaviate store."

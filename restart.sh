#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Stopping all services..."
"$ROOT_DIR/stop.sh"

echo ""
echo "Starting all services..."
"$ROOT_DIR/start.sh"

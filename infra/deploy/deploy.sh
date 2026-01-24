#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

echo "[KadryHR] Updating repository..."
git pull origin main

echo "[KadryHR] Running start script..."
"$ROOT_DIR/infra/deploy/start.sh"

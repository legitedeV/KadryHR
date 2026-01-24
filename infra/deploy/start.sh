#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT_DIR"

echo "[KadryHR] Starting services via Docker Compose..."
docker compose up -d --build

echo "[KadryHR] Services are starting."

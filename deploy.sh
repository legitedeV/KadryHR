#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/deploy/apps/kadryhr-app"
BACK="$ROOT/backend-v2"
FRONT="$ROOT/frontend-v2"

PM2_FRONT_ID="13"
PM2_BACK_ID="17"

BRANCH="${1:-main}"

log() { echo -e "\n\033[1;32m==> $*\033[0m"; }
warn() { echo -e "\n\033[1;33m[WARN] $*\033[0m"; }
die() { echo -e "\n\033[1;31m[ERR] $*\033[0m"; exit 1; }

require_file() {
  local f="$1"
  [[ -f "$f" ]] || die "Missing file: $f"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

log "Preflight checks"
require_cmd git
require_cmd node
require_cmd npm
require_cmd pm2

require_file "$BACK/package.json"
require_file "$FRONT/package.json"

# ---- ENV sanity checks (nie wypisujemy sekretów) ----
log "Checking env files (sanity)"
if [[ -f "$BACK/.env" ]]; then
  grep -q '^DATABASE_URL=' "$BACK/.env" || warn "backend-v2/.env missing DATABASE_URL"
  grep -Eq '^(PORT|APP_PORT)=' "$BACK/.env" || warn "backend-v2/.env missing PORT/APP_PORT"
else
  warn "backend-v2/.env not found"
fi

if [[ -f "$FRONT/.env.local" ]]; then
  grep -q '^NEXT_PUBLIC_API_URL=' "$FRONT/.env.local" || warn "frontend-v2/.env.local missing NEXT_PUBLIC_API_URL"
else
  warn "frontend-v2/.env.local not found"
fi

# ---- GIT SYNC ----
log "Git sync ($BRANCH)"
cd "$ROOT"
git fetch origin
# nie wymuszam checkout jeśli jesteś na innym branżu; ustawiamy bezpiecznie
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  log "Switch branch: $CURRENT_BRANCH -> $BRANCH"
  git checkout "$BRANCH"
fi
git pull --ff-only origin "$BRANCH" || die "git pull failed (non-ff). Resolve manually."

# ---- BACKEND ----
log "Backend: install deps"
cd "$BACK"
npm ci

log "Backend: Prisma generate"
npx prisma generate

# migrate deploy jeśli są migracje, inaczej db push (u Ciebie brak migrations)
if [[ -d "$BACK/prisma/migrations" ]] && [[ "$(ls -A "$BACK/prisma/migrations" 2>/dev/null | wc -l)" -gt 0 ]]; then
  log "Backend: prisma migrate deploy"
  npx prisma migrate deploy
fi

log "Backend: build"
npm run build

# ---- FRONTEND ----
log "Frontend: install deps"
cd "$FRONT"
npm ci

log "Frontend: build"
npm run build

# ---- PM2 RESTART ----
log "PM2 restart backend (ID=$PM2_BACK_ID) and frontend (ID=$PM2_FRONT_ID)"
pm2 restart "$PM2_BACK_ID" --update-env
pm2 restart "$PM2_FRONT_ID" --update-env

# opcjonalnie zapis stanu pm2
pm2 save >/dev/null 2>&1 || true

# ---- HEALTH CHECKS ----
log "Health checks (best-effort)"
# backend port: spróbuj 4000 i 5000 i 3001 (bez failowania deploya)
for port in 4000 5000 3001; do
  if curl -fsS "http://127.0.0.1:${port}/api/health" >/dev/null 2>&1; then
    log "Backend OK: http://127.0.0.1:${port}/api/health"
    break
  fi
done || true

log "Tail logs (last 20 lines)"
pm2 logs "$PM2_BACK_ID" --lines 20 --nostream || true
pm2 logs "$PM2_FRONT_ID" --lines 20 --nostream || true

log "DONE ✅"

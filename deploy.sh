#!/usr/bin/env bash
set -euo pipefail

### KONFIG POD TWOJE ŚRODOWISKO ###

# Script dir = root repo (KadryHR)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

APP_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$APP_ROOT/backend-v2"
FRONTEND_DIR="$APP_ROOT/frontend-v2"

BACKEND_PM2_NAME="kadryhr-api"
FRONTEND_PM2_NAME="kadryhr-web"

BACKEND_PORT=4000   # NestJS APP_PORT
FRONTEND_PORT=3000  # Next.js PORT

###################################

log() {
  echo -e "\033[1;32m[deploy]\033[0m $*"
}

fail() {
  echo -e "\033[1;31m[deploy ERROR]\033[0m $*" >&2
  exit 1
}

### 1. Sprawdzenie narzędzi ###

for cmd in node npm pm2; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "Brak komendy '$cmd' w PATH. Zainstaluj ją zanim odpalisz deploy."
  fi
done

log "Node: $(node -v)"
log "npm:  $(npm -v)"
log "pm2:  $(pm2 -v)"

### 2. Backend (NestJS + Prisma) ###

deploy_backend() {
  log "== Backend (backend-v2) =="

  cd "$BACKEND_DIR"

  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      cp .env.example .env
      log "Skopiowano .env.example -> .env (PAMIĘTAJ, żeby podmienić hasła/maile itp.)"
    else
      fail "Brak .env oraz .env.example w $BACKEND_DIR"
    fi
  fi

  if [ "${SKIP_INSTALL:-0}" != "1" ]; then
    log "Backend: npm install (może chwilę potrwać)"
    npm install
  else
    log "Backend: SKIP_INSTALL=1 – pomijam npm install"
  fi

  log "Backend: Prisma migrate deploy"
  # Prisma sam wczyta .env z backend-v2
  npx prisma migrate deploy --schema=prisma/schema.prisma

  log "Backend: build (npm run build)"
  npm run build

  log "Backend: restart przez pm2 (${BACKEND_PM2_NAME})"

  if pm2 describe "$BACKEND_PM2_NAME" >/dev/null 2>&1; then
    pm2 stop "$BACKEND_PM2_NAME" || true
    pm2 delete "$BACKEND_PM2_NAME" || true
  fi

  APP_PORT="$BACKEND_PORT" NODE_ENV=production \
    pm2 start dist/main.js \
      --name "$BACKEND_PM2_NAME" \
      --cwd "$BACKEND_DIR"

  log "Backend wystartowany na porcie ${BACKEND_PORT} (za Nginxem /api/)"
}

### 3. Frontend (Next.js) ###

deploy_frontend() {
  log "== Frontend (frontend-v2) =="

  cd "$FRONTEND_DIR"

  if [ ! -f .env.local ] && [ -f .env.example ]; then
    log "Frontend: brak .env.local – jeśli potrzebujesz zmiennych, skopiuj .env.example do .env.local i podmień wartości."
  fi

  if [ "${SKIP_INSTALL:-0}" != "1" ]; then
    log "Frontend: npm install"
    npm install
  else
    log "Frontend: SKIP_INSTALL=1 – pomijam npm install"
  fi

  log "Frontend: czyszczenie .next"
  rm -rf .next

  log "Frontend: build (npm run build)"
  npm run build

  log "Frontend: restart przez pm2 (${FRONTEND_PM2_NAME})"

  if pm2 describe "$FRONTEND_PM2_NAME" >/dev/null 2>&1; then
    pm2 stop "$FRONTEND_PM2_NAME" || true
    pm2 delete "$FRONTEND_PM2_NAME" || true
  fi

  NODE_ENV=production PORT="$FRONTEND_PORT" \
    pm2 start npm --name "$FRONTEND_PM2_NAME" --cwd "$FRONTEND_DIR" -- start

  log "Frontend wystartowany na porcie ${FRONTEND_PORT} (proxy z kadryhr.pl przez Nginx)"
}

### 4. Odpalamy całość ###

deploy_backend
deploy_frontend

log "Zapisuję konfigurację PM2 (restart po reboocie)..."
pm2 save

log "Deploy zakończony."
log "Szybki healthcheck:"
log "  curl -k https://kadryhr.pl/api/config/frontend   # API"
log "  curl -k https://kadryhr.pl                      # frontend"

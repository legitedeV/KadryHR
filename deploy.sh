#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/deploy/apps/kadryhr-app"
BACKEND_DIR="$APP_DIR/backend-v2"
FRONTEND_DIR="$APP_DIR/frontend-v2"

# dostosuj nazwy procesów PM2 do tego, co masz
PM2_BACKEND_NAME="kadryhr-backend-v2"
PM2_FRONTEND_NAME="kadryhr-frontend-v2"

echo "==> KadryHR deploy start"
cd "$APP_DIR"

OLD_REV=$(git rev-parse HEAD)
echo "Current HEAD: $OLD_REV"

echo "==> git pull origin main"
git pull origin main

NEW_REV=$(git rev-parse HEAD)
echo "New HEAD: $NEW_REV"

echo "==> Detecting changed files"
CHANGED_FILES=$(git diff --name-only "$OLD_REV" "$NEW_REV")

BACKEND_CHANGED="false"
if echo "$CHANGED_FILES" | rg -q "^backend-v2/"; then
  BACKEND_CHANGED="true"
fi

FRONTEND_CHANGED="false"
if echo "$CHANGED_FILES" | rg -q "^frontend-v2/"; then
  FRONTEND_CHANGED="true"
fi

BACKEND_LOCK_CHANGED="false"
if echo "$CHANGED_FILES" | rg -q "^backend-v2/package-lock.json$"; then
  BACKEND_LOCK_CHANGED="true"
fi

FRONTEND_LOCK_CHANGED="false"
if echo "$CHANGED_FILES" | rg -q "^frontend-v2/package-lock.json$"; then
  FRONTEND_LOCK_CHANGED="true"
fi

if [ "$BACKEND_CHANGED" = "false" ] && [ "$FRONTEND_CHANGED" = "false" ]; then
  echo "No backend-v2 or frontend-v2 changes detected. Nothing to build."
  exit 0
fi

# ---------------- BACKEND ----------------

if [ "$BACKEND_CHANGED" = "true" ]; then
  cd "$BACKEND_DIR"

  if [ "$BACKEND_LOCK_CHANGED" = "true" ]; then
    echo "==> Backend lockfile changed – running npm ci --omit=dev"
    npm ci --omit=dev
  else
    echo "==> Backend lockfile unchanged – skipping npm ci"
  fi

  echo "==> Running database migrations"
  npx prisma migrate deploy

  echo "==> Generating Prisma client"
  npx prisma generate

  echo "==> Building backend"
  npm run build

  echo "==> Reloading backend with PM2 ($PM2_BACKEND_NAME)"
  if pm2 describe "$PM2_BACKEND_NAME" > /dev/null 2>&1; then
    pm2 reload "$PM2_BACKEND_NAME"
  else
    # dopasuj ścieżkę startową do swojej aplikacji Nest
    pm2 start dist/main.js --name "$PM2_BACKEND_NAME"
  fi
else
  echo "==> No backend-v2 changes – skipping backend build"
fi

# ---------------- FRONTEND ----------------

if [ "$FRONTEND_CHANGED" = "true" ]; then
  cd "$FRONTEND_DIR"

  if [ "$FRONTEND_LOCK_CHANGED" = "true" ]; then
    echo "==> Frontend lockfile changed – running npm ci --omit=dev"
    npm ci --omit=dev
  else
    echo "==> Frontend lockfile unchanged – skipping npm ci"
  fi

  echo "==> Clearing Next.js cache to prevent stale Server Actions"
  rm -rf .next

  echo "==> Building frontend"
  npm run build

  echo "==> Restarting frontend with PM2 ($PM2_FRONTEND_NAME)"
  if pm2 describe "$PM2_FRONTEND_NAME" > /dev/null 2>&1; then
    pm2 restart "$PM2_FRONTEND_NAME"
  else
    # jeśli masz Next.js w trybie `next start`:
    pm2 start "npm -- start -p 3000" --name "$PM2_FRONTEND_NAME"
  fi
else
  echo "==> No frontend-v2 changes – skipping frontend build"
fi

echo "==> Deploy finished successfully"

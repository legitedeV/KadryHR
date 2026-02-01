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

if [ "$OLD_REV" = "$NEW_REV" ]; then
  echo "No new commits. Nothing to deploy."
  exit 0
fi

echo "==> Checking if backend deps changed..."
BACKEND_DEPS_CHANGED="false"
if git diff --name-only "$OLD_REV" "$NEW_REV" -- backend-v2/package.json backend-v2/package-lock.json | grep -q .; then
  BACKEND_DEPS_CHANGED="true"
fi

echo "==> Checking if frontend deps changed..."
FRONTEND_DEPS_CHANGED="false"
if git diff --name-only "$OLD_REV" "$NEW_REV" -- frontend-v2/package.json frontend-v2/package-lock.json | grep -q .; then
  FRONTEND_DEPS_CHANGED="true"
fi

# ---------------- BACKEND ----------------

cd "$BACKEND_DIR"

if [ "$BACKEND_DEPS_CHANGED" = "true" ]; then
  echo "==> Backend deps changed – running npm ci --omit=dev"
  npm ci --omit=dev
else
  echo "==> Backend deps unchanged – skipping npm ci"
fi

echo "==> Building backend"
npm run build

echo "==> Restarting backend with PM2 ($PM2_BACKEND_NAME)"
if pm2 describe "$PM2_BACKEND_NAME" > /dev/null 2>&1; then
  pm2 stop "$PM2_BACKEND_NAME"
  pm2 delete "$PM2_BACKEND_NAME"
fi
# dopasuj ścieżkę startową do swojej aplikacji Nest
pm2 start dist/main.js --name "$PM2_BACKEND_NAME" --cwd "$BACKEND_DIR"

# ---------------- FRONTEND ----------------

cd "$FRONTEND_DIR"

if [ "$FRONTEND_DEPS_CHANGED" = "true" ]; then
  echo "==> Frontend deps changed – running npm ci --omit=dev"
  npm ci --omit=dev
else
  echo "==> Frontend deps unchanged – skipping npm ci"
fi

echo "==> Building frontend"
rm -rf .next
npm run build

echo "==> Restarting frontend with PM2 ($PM2_FRONTEND_NAME)"
if pm2 describe "$PM2_FRONTEND_NAME" > /dev/null 2>&1; then
  pm2 stop "$PM2_FRONTEND_NAME"
  pm2 delete "$PM2_FRONTEND_NAME"
fi
# jeśli masz Next.js w trybie `next start`:
pm2 start "npm -- start -p 3000" --name "$PM2_FRONTEND_NAME" --cwd "$FRONTEND_DIR"

echo "==> Deploy finished successfully"

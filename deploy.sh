#!/usr/bin/env bash
set -e

APP_DIR="/home/deploy/apps/kadryhr-app"
BACKEND_DIR="$APP_DIR/apps/api"
FRONTEND_DIR="$APP_DIR/apps/web"
cd "$APP_DIR"
git pull origin main

echo ">>> [deploy] Start deploya KadryHR"

cd "$APP_DIR"
echo ">>> [deploy] Aktualny katalog: $(pwd)"

echo ">>> [deploy] Backend: npm install + build"
cd "$BACKEND_DIR"
npm install
npm run build

echo ">>> [deploy] Backend: restart PM2"
if pm2 describe kadryhr-backend >/dev/null 2>&1; then
  pm2 restart kadryhr-backend --update-env
else
  pm2 start npm --name kadryhr-backend -- run start:prod
fi

echo ">>> [deploy] Frontend: npm install + build"
cd "$FRONTEND_DIR"
npm install
npm run build

echo ">>> [deploy] Reload Nginx"
sudo systemctl reload nginx


echo ">>> [deploy] DONE"

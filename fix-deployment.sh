#!/usr/bin/env bash
# fix-deployment.sh - Napraw problemy po wdrożeniu

set -e

echo "🔧 KadryHR - Naprawa Wdrożenia"
echo "================================"
echo ""

APP_DIR="/home/deploy/apps/kadryhr-app"
BACKEND_DIR="$APP_DIR/apps/legacy-api"
FRONTEND_DIR="$APP_DIR/apps/legacy-web"

# Sprawdź czy jesteśmy w odpowiednim katalogu
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Katalog $APP_DIR nie istnieje!"
    echo "   Uruchom ten skrypt na serwerze produkcyjnym."
    exit 1
fi

cd "$APP_DIR"

echo "📍 Katalog: $(pwd)"
echo ""

# 1. Wyczyść niepotrzebne pakiety z roota
echo "🧹 Krok 1: Czyszczenie root node_modules..."
if [ -f "package-lock.json" ]; then
    echo "   Usuwam package-lock.json..."
    rm -f package-lock.json
fi

if [ -d "node_modules" ]; then
    echo "   Usuwam node_modules..."
    rm -rf node_modules
fi

if npm list build >/dev/null 2>&1; then
    echo "   Usuwam pakiet 'build'..."
    npm uninstall build 2>/dev/null || true
fi

echo "   ✅ Root wyczyszczony"
echo ""

# 2. Sprawdź nginx
echo "🌐 Krok 2: Sprawdzanie Nginx..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx jest aktywny"
    echo "   Przeładowuję konfigurację..."
    sudo systemctl reload nginx
    echo "   ✅ Nginx przeładowany"
else
    echo "   ⚠️  Nginx nie jest aktywny!"
    echo "   Próbuję uruchomić..."
    
    if sudo systemctl start nginx; then
        echo "   ✅ Nginx uruchomiony"
        sudo systemctl enable nginx
        echo "   ✅ Nginx włączony do autostartu"
    else
        echo "   ❌ Nie udało się uruchomić Nginx"
        echo "   Sprawdź logi: sudo journalctl -u nginx -n 50"
        echo "   Test konfiguracji: sudo nginx -t"
    fi
fi
echo ""

# 3. Sprawdź backend PM2
echo "🚀 Krok 3: Sprawdzanie Backend (PM2)..."
if pm2 describe kadryhr-backend >/dev/null 2>&1; then
    echo "   ✅ Backend działa w PM2"
    pm2 list | grep kadryhr-backend
else
    echo "   ⚠️  Backend nie jest uruchomiony w PM2"
    echo "   Uruchamiam..."
    cd "$BACKEND_DIR"
    pm2 start server.js --name kadryhr-backend
    cd "$APP_DIR"
    echo "   ✅ Backend uruchomiony"
fi
echo ""

# 4. Sprawdź frontend build
echo "🎨 Krok 4: Sprawdzanie Frontend..."
if [ -d "$FRONTEND_DIR/dist" ]; then
    echo "   ✅ Frontend zbudowany (dist/ istnieje)"
    echo "   Pliki:"
    ls -lh "$FRONTEND_DIR"/dist/ | head -5
else
    echo "   ⚠️  Brak katalogu dist/"
    echo "   Buduję frontend..."
    cd "$FRONTEND_DIR"
    npm install
    npm run build
    cd "$APP_DIR"
    echo "   ✅ Frontend zbudowany"
fi
echo ""

# 5. Test API
echo "🧪 Krok 5: Testowanie API..."
if curl -s http://localhost:5000/health >/dev/null 2>&1; then
    echo "   ✅ Backend API odpowiada"
    echo "   Health check:"
    curl -s http://localhost:5000/health | head -10
else
    echo "   ❌ Backend API nie odpowiada"
    echo "   Sprawdź logi: pm2 logs kadryhr-backend"
fi
echo ""

# 6. Podsumowanie
echo "================================"
echo "✅ Naprawa zakończona!"
echo ""
echo "📋 Następne kroki:"
echo "   1. Sprawdź logi backendu: pm2 logs kadryhr-backend"
echo "   2. Sprawdź status nginx: sudo systemctl status nginx"
echo "   3. Otwórz aplikację w przeglądarce: http://kadryhr.pl"
echo ""
echo "📚 Dokumentacja:"
echo "   - DEPLOYMENT_FIXES.md - Szczegółowe rozwiązywanie problemów"
echo "   - IMPROVEMENTS_IMPLEMENTED.md - Lista wszystkich ulepszeń"
echo "   - QUICK_START.md - Szybki start"
echo ""

# Deployment Fixes & Troubleshooting 🔧

## Status Wdrożenia

✅ **Backend:** Wdrożony pomyślnie (PM2 restart: 611 restartów)
✅ **Frontend:** Zbudowany pomyślnie (dist/ utworzony)
⚠️ **Nginx:** Wymaga uruchomienia

---

## Naprawione Problemy

### 1. ✅ Usunięto Puppeteer z Root package.json

**Problem:**
```
UNMET DEPENDENCY puppeteer @^24.34.0
```

**Rozwiązanie:**
- Usunięto puppeteer z głównego package.json
- Dodano użyteczne npm scripts
- Puppeteer nie jest potrzebny w produkcji

**Nowy package.json:**
```json
{
  "scripts": {
    "install:all": "cd backend && npm install && cd ../frontend && npm install",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build:frontend": "cd frontend && npm run build",
    "start:backend": "cd backend && npm start"
  }
}
```

---

## Problemy do Naprawienia na Serwerze

### 2. ⚠️ Nginx Nie Jest Aktywny

**Problem:**
```
nginx.service is not active, cannot reload.
```

**Rozwiązanie - Uruchom na serwerze:**

```bash
# Sprawdź status nginx
sudo systemctl status nginx

# Jeśli nie jest aktywny, uruchom:
sudo systemctl start nginx

# Włącz autostart przy restarcie serwera:
sudo systemctl enable nginx

# Sprawdź czy konfiguracja jest poprawna:
sudo nginx -t

# Jeśli są błędy w konfiguracji, sprawdź logi:
sudo journalctl -u nginx -n 50
```

**Jeśli nginx nie jest zainstalowany:**
```bash
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

### 3. 🧹 Przypadkowo Zainstalowany Pakiet "build"

**Problem:**
```bash
npm install build  # To zainstalowało niepotrzebny pakiet
```

**Rozwiązanie - Uruchom na serwerze:**

```bash
cd /home/deploy/apps/kadryhr-app

# Usuń niepotrzebny pakiet
npm uninstall build

# Usuń node_modules i package-lock.json z roota
rm -rf node_modules package-lock.json

# Zainstaluj ponownie (teraz będzie czysto)
npm install
```

---

## Weryfikacja Wdrożenia

### Sprawdź Backend (PM2):

```bash
# Status PM2
pm2 status

# Logi backendu
pm2 logs kadryhr-backend --lines 50

# Restart jeśli potrzeba
pm2 restart kadryhr-backend

# Monitorowanie
pm2 monit
```

### Sprawdź Frontend:

```bash
# Sprawdź czy dist/ został utworzony
ls -la /home/deploy/apps/kadryhr-app/frontend/dist/

# Powinno być:
# - index.html
# - assets/index-*.css
# - assets/index-*.js
```

### Sprawdź Nginx:

```bash
# Status
sudo systemctl status nginx

# Test konfiguracji
sudo nginx -t

# Logi błędów
sudo tail -f /var/log/nginx/error.log

# Logi dostępu
sudo tail -f /var/log/nginx/access.log
```

---

## Testowanie Aplikacji

### 1. Test Backend API:

```bash
# Health check
curl http://localhost:5000/health

# Powinno zwrócić JSON z metrykami:
# {
#   "status": "healthy",
#   "uptime": {...},
#   "memory": {...},
#   "cache": {...},
#   "database": {...}
# }

# Test demo login
curl -X POST http://localhost:5000/api/auth/demo

# Powinno zwrócić token i dane użytkownika
```

### 2. Test Frontend:

```bash
# Jeśli nginx działa na porcie 80:
curl http://localhost/

# Lub sprawdź bezpośrednio plik:
cat /home/deploy/apps/kadryhr-app/frontend/dist/index.html
```

### 3. Test z Przeglądarki:

Otwórz w przeglądarce:
- `http://kadryhr.pl` - Landing page
- `http://kadryhr.pl/login` - Strona logowania
- Kliknij "Zobacz Demo" - powinno przekierować do `/app`

---

## Komendy PM2 (Przydatne)

```bash
# Lista procesów
pm2 list

# Logi
pm2 logs kadryhr-backend
pm2 logs kadryhr-backend --lines 100
pm2 logs kadryhr-backend --err  # Tylko błędy

# Restart
pm2 restart kadryhr-backend

# Stop
pm2 stop kadryhr-backend

# Start
pm2 start kadryhr-backend

# Usuń z PM2
pm2 delete kadryhr-backend

# Zapisz konfigurację PM2 (autostart po restarcie serwera)
pm2 save
pm2 startup
```

---

## Monitoring Wydajności

### Backend Performance:

Po wdrożeniu nowych middleware, sprawdź logi:

```bash
pm2 logs kadryhr-backend --lines 100
```

Powinieneś zobaczyć:
- 🟢 **Kolorowe logi** z emoji
- ⚡ **Performance metrics** - czasy odpowiedzi
- 💾 **Cache HIT/MISS** - statystyki cache
- 🔐 **Auth logs** - logowania użytkowników

**Przykładowe logi:**
```
✅ SUCCESS [2025-12-22T20:00:00.000Z] MongoDB connected
⚡ Performance [GET] /api/employees - 145ms | Memory: +1.23MB heap
💾 Cache HIT GET:/api/schedule:user123 (age: 45s)
🔐 AUTH [demo_login] demo@kadryhr.pl (admin)
```

---

## Rozwiązywanie Problemów

### Problem: Backend nie startuje

```bash
# Sprawdź logi PM2
pm2 logs kadryhr-backend --err

# Sprawdź czy MongoDB działa
sudo systemctl status mongod

# Sprawdź zmienne środowiskowe
pm2 env 0  # gdzie 0 to ID procesu
```

### Problem: Frontend nie ładuje się

```bash
# Sprawdź czy dist/ istnieje
ls -la frontend/dist/

# Przebuduj frontend
cd frontend
npm run build

# Sprawdź konfigurację nginx
sudo nginx -t
cat /etc/nginx/sites-available/kadryhr.pl
```

### Problem: Błędy CORS

```bash
# Sprawdź logi backendu
pm2 logs kadryhr-backend | grep CORS

# Sprawdź zmienną FRONTEND_URL w .env
cat backend/.env | grep FRONTEND_URL
```

---

## Następne Kroki

1. **Uruchom Nginx:**
   ```bash
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

2. **Wyczyść root node_modules:**
   ```bash
   cd /home/deploy/apps/kadryhr-app
   npm uninstall build
   rm -rf node_modules package-lock.json
   ```

3. **Przetestuj aplikację:**
   ```bash
   curl http://localhost:5000/health
   curl http://localhost/
   ```

4. **Monitoruj logi:**
   ```bash
   pm2 logs kadryhr-backend --lines 50
   ```

---

## Podsumowanie Wdrożenia

✅ **Backend:** Działa (PM2 process ID: 0)
✅ **Frontend:** Zbudowany (dist/ utworzony)
✅ **Nowe funkcje:** Wdrożone
- Performance monitoring
- Smart caching
- Enhanced logging
- Health check endpoint
- Animacje na landing page

⚠️ **Do zrobienia:**
- Uruchomić nginx
- Wyczyścić niepotrzebne pakiety z roota

---

## Kontakt i Wsparcie

Jeśli masz problemy:
1. Sprawdź logi: `pm2 logs kadryhr-backend`
2. Sprawdź health check: `curl http://localhost:5000/health`
3. Sprawdź nginx: `sudo systemctl status nginx`

Wszystkie nowe funkcje są udokumentowane w:
- `IMPROVEMENTS_IMPLEMENTED.md`
- `QUICK_START.md`

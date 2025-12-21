# Instrukcje wdrożenia poprawek tokenu

## Szybkie wdrożenie

### Na serwerze produkcyjnym (jako użytkownik deploy):

```bash
# 1. Przejdź do katalogu aplikacji
cd /home/deploy/apps/kadryhr-app

# 2. Pobierz najnowsze zmiany
git pull origin main

# 3. Uruchom skrypt deploy
./deploy.sh
```

Skrypt automatycznie:
- Zainstaluje zależności backendu
- Zrestartuje backend (PM2)
- Zbuduje frontend
- Przeładuje Nginx

## Weryfikacja po wdrożeniu

### 1. Sprawdź status backendu
```bash
pm2 status
pm2 logs kadryhr-backend --lines 50
```

Powinieneś zobaczyć:
```
✅ Połączono z MongoDB: mongodb://127.0.0.1:27017/kadryhr
✅ KadryHR backend słucha na porcie 5000
```

### 2. Testuj w przeglądarce

1. Otwórz http://kadryhr.pl
2. Otwórz DevTools (F12) → Console
3. Zaloguj się jako `test@test.pl` / `Test123!`
4. Sprawdź logi w konsoli - powinny być zielone/niebieskie, bez czerwonych błędów
5. Przejdź do "Panel pracownika" (`/self-service`)
6. Sprawdź czy:
   - ✅ Brak czerwonego komunikatu o błędzie tokenu
   - ✅ Lista pracowników się ładuje
   - ✅ Możesz dodać sugestię
   - ✅ Możesz złożyć wniosek urlopowy

### 3. Sprawdź logi w konsoli przeglądarki

**Prawidłowe logi:**
```
[AuthContext] Logowanie użytkownika: {id: "...", email: "test@test.pl", ...}
[API] Dodano token do żądania: {method: "GET", url: "/employees/compact", ...}
[API] Sukces: {status: 200, method: "GET", url: "/employees/compact"}
[SelfService] Pobrano pracowników: 5
```

**Błędne logi (jeśli coś nie działa):**
```
[API] Błąd odpowiedzi: {status: 401, message: "Brak tokenu..."}
[AuthContext] Token nieważny, czyszczenie sesji
```

### 4. Sprawdź logi backendu

```bash
pm2 logs kadryhr-backend --lines 100
```

**Prawidłowe logi:**
```
[AUTH] Token znaleziony: {source: "header", path: "/employees/compact", ...}
[AUTH] Użytkownik zautoryzowany: {userId: "...", email: "test@test.pl", role: "user"}
```

**Błędne logi (jeśli coś nie działa):**
```
[AUTH] Brak tokenu w żądaniu: {path: "/employees/compact", ...}
[AUTH] Błąd weryfikacji tokenu: {error: "jwt expired", ...}
```

## Rozwiązywanie problemów

### Problem: Nadal błąd tokenu

**Rozwiązanie 1: Wyczyść cache przeglądarki**
```
1. Otwórz DevTools (F12)
2. Kliknij prawym na przycisk Odśwież
3. Wybierz "Wyczyść pamięć podręczną i wymuszone przeładowanie"
```

**Rozwiązanie 2: Wyczyść localStorage**
```javascript
// W konsoli przeglądarki:
localStorage.clear()
// Następnie odśwież stronę i zaloguj się ponownie
```

**Rozwiązanie 3: Sprawdź JWT_SECRET**
```bash
# Na serwerze:
cat /home/deploy/apps/kadryhr-app/backend/.env | grep JWT_SECRET

# Upewnij się, że JWT_SECRET nie został zmieniony
# Jeśli został zmieniony, wszystkie stare tokeny są nieważne
```

### Problem: Backend nie startuje

```bash
# Sprawdź logi PM2
pm2 logs kadryhr-backend --err --lines 50

# Sprawdź czy MongoDB działa
sudo systemctl status mongod

# Jeśli MongoDB nie działa:
sudo systemctl start mongod
```

### Problem: Frontend nie ładuje się

```bash
# Sprawdź czy build się powiódł
cd /home/deploy/apps/kadryhr-app/frontend
ls -la dist/

# Jeśli brak katalogu dist/, zbuduj ponownie:
npm run build

# Sprawdź konfigurację Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## Rollback (jeśli coś pójdzie nie tak)

```bash
cd /home/deploy/apps/kadryhr-app

# Cofnij do poprzedniego commita
git log --oneline -5  # Zobacz ostatnie commity
git reset --hard <poprzedni-commit-hash>

# Wdróż poprzednią wersję
./deploy.sh
```

## Kontakt w razie problemów

Jeśli po wdrożeniu nadal występują problemy:

1. **Zbierz logi:**
   ```bash
   pm2 logs kadryhr-backend --lines 200 > backend-logs.txt
   ```

2. **Zbierz logi przeglądarki:**
   - Otwórz DevTools → Console
   - Kliknij prawym na logi → "Save as..."

3. **Sprawdź Network tab:**
   - DevTools → Network
   - Odśwież stronę
   - Znajdź żądanie z błędem 401
   - Kliknij → Headers → skopiuj Request Headers i Response

4. **Wyślij informacje:**
   - Logi backendu
   - Logi przeglądarki
   - Szczegóły żądania HTTP
   - Opis problemu

## Dodatkowe informacje

### Zmienione pliki:
- ✅ `/backend/middleware/authMiddleware.js` - dodano szczegółowe logowanie
- ✅ `/frontend/src/api/axios.js` - dodano auto-logout przy 401
- ✅ `/frontend/src/context/AuthContext.jsx` - dodano weryfikację tokenu
- ✅ `/frontend/src/App.jsx` - dodano loading state
- ✅ `/frontend/src/pages/SelfService.jsx` - dodano obsługę błędów
- ✅ `/frontend/src/components/Navbar.jsx` - naprawiono błąd składni

### Nowe funkcje:
- 🔍 Szczegółowe logowanie autoryzacji (backend + frontend)
- 🔄 Automatyczne wylogowanie przy wygasłym tokenie
- ⏳ Weryfikacja tokenu przy starcie aplikacji
- 📊 Wizualne komunikaty o błędach w panelu pracownika
- 🎯 Lepsze rozróżnienie typów błędów JWT

### Bezpieczeństwo:
- ✅ Token nadal wysyłany jako httpOnly cookie (bezpieczne)
- ✅ Dodatkowo wspierany Authorization header (kompatybilność)
- ✅ Automatyczne czyszczenie nieprawidłowych tokenów
- ✅ Szczegółowe logowanie bez ujawniania pełnego tokenu

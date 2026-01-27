# Testowanie funkcji RCP (Rejestracja Czasu Pracy) z geolokalizacją QR

## Przegląd

Funkcja RCP pozwala pracownikom rejestrować czas pracy poprzez skanowanie kodów QR z weryfikacją geolokalizacji. System wymaga aby pracownik znajdował się w określonym promieniu od lokalizacji (geofence) aby pomyślnie zarejestrować wejście lub wyjście.

## Przygotowanie środowiska testowego

### 1. Backend (NestJS)

```bash
cd backend-v2

# Instalacja zależności (jeśli jeszcze nie zainstalowano)
npm install

# Uruchomienie bazy danych (jeśli używasz Docker)
# docker-compose up -d postgres

# Uruchomienie migracji Prisma
npx prisma migrate deploy

# (Opcjonalnie) Seed testowych danych
npx prisma db seed

# Uruchomienie backendu w trybie dev
npm run start:dev
```

Backend będzie dostępny pod adresem `http://localhost:4000/api`

### 2. Frontend (Next.js)

```bash
cd frontend-v2

# Instalacja zależności (jeśli jeszcze nie zainstalowano)
npm install

# Uruchomienie frontendu w trybie dev
npm run dev
```

Frontend będzie dostępny pod adresem `http://localhost:3000`

## Testowanie w przeglądarce (desktop)

### Konfiguracja lokalizacji (Panel administracyjny)

1. Zaloguj się jako Manager/Admin/Owner:
   - Email: `owner@seed.local`
   - Hasło: `ChangeMe123!`

2. Przejdź do sekcji **RCP** w panelu (`/panel/rcp`)

3. Skonfiguruj lokalizację:
   - Wybierz lokalizację z listy (np. "Sklep główny")
   - Wprowadź współrzędne geograficzne:
     - **Szerokość geograficzna**: `52.2297` (Warszawa, centrum)
     - **Długość geograficzna**: `21.0122`
   - Ustaw promień geofence: `100m` (domyślnie)
   - Ustaw maksymalną niedokładność GPS: `100m`
   - Włącz przełącznik **"RCP włączone"**

4. Wygeneruj kod QR:
   - Kliknij przycisk **"Wygeneruj kod QR"**
   - Kod QR zostanie wyświetlony
   - Możesz go pobrać (PNG) lub wydrukować

5. Skopiuj URL z kodu QR lub otwórz stronę mobilną bezpośrednio:
   - URL będzie w formacie: `http://localhost:3000/m/rcp?token=<TOKEN>`

### Testowanie rejestracji (strona mobilna)

1. Otwórz URL kodu QR w nowej karcie/oknie przeglądarki

2. Zaloguj się jako pracownik:
   - Email: `ethan.kowalski@seed.local`
   - Hasło: `ChangeMe123!`

3. Na stronie RCP:
   - Kliknij **"Pobierz lokalizację"**
   - Przeglądarka poprosi o zezwolenie na dostęp do lokalizacji - **POTWIERDŹ**

4. **Symulacja lokalizacji w Chrome/Firefox DevTools:**

   **Chrome:**
   - Otwórz DevTools (F12)
   - Przejdź do zakładki **Console**
   - Kliknij menu ⋮ (trzy kropki) → **More tools** → **Sensors**
   - W sekcji **Location** wybierz:
     - **Custom location**
     - Wprowadź współrzędne: `52.2297, 21.0122` (te same co lokalizacja)
     - Lub wybierz predefiniowaną lokalizację np. "Warsaw, Poland"
   - Odśwież stronę i ponownie kliknij "Pobierz lokalizację"

   **Firefox:**
   - Otwórz DevTools (F12)
   - Przejdź do **Settings** (⚙️) → **Advanced Settings**
   - Znajdź **Override Geolocation**
   - Wprowadź współrzędne: `52.2297, 21.0122`
   - Odśwież stronę

5. Po pobraniu lokalizacji:
   - Sprawdź czy współrzędne są wyświetlone
   - Sprawdź dokładność GPS (powinna być < 100m)
   - Kliknij **"Wejście ▶"** aby zarejestrować clock-in

6. Komunikaty sukcesu/błędów:
   - ✅ **Sukces**: "Wejście zarejestrowane (Xm)" - wyświetli odległość od lokalizacji
   - ❌ **Błąd geofence**: "Poza obszarem sklepu (120m > 100m)"
   - ❌ **Błąd dokładności**: "Dokładność lokalizacji jest zbyt niska"
   - ❌ **Token wygasł**: "Token wygasł. Poproś kierownika o nowy kod QR"

7. Po pomyślnym clock-in:
   - Status zmieni się na **"🟢 Zalogowany"**
   - Przycisk "Wyjście ⏹" stanie się aktywny
   - Kliknij go aby zarejestrować clock-out

## Testowanie na prawdziwym urządzeniu mobilnym

### Przygotowanie

1. **Upewnij się że backend i frontend są dostępne w sieci lokalnej:**

   Backend:
   ```bash
   cd backend-v2
   # Upewnij się że APP_PORT w .env to 4000
   npm run start:dev
   ```

   Frontend:
   ```bash
   cd frontend-v2
   npm run dev -- --hostname 0.0.0.0
   ```

2. **Znajdź adres IP swojego komputera w sieci lokalnej:**

   Linux/Mac:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

   Windows:
   ```cmd
   ipconfig
   ```

   Przykład IP: `192.168.1.100`

3. **Zaktualizuj zmienną FRONTEND_URL w backendzie:**
   ```bash
   # backend-v2/.env
   FRONTEND_URL="http://192.168.1.100:3000"
   ```

### Testowanie

1. **Na komputerze:**
   - Wygeneruj kod QR jak opisano wcześniej
   - Użyj przycisku **"Drukuj"** lub **"Pobierz"**

2. **Na telefonie:**
   - Zeskanuj wydrukowany/wyświetlony kod QR (używając aplikacji kamery lub skanera QR)
   - LUB otwórz przeglądarkę i wpisz: `http://192.168.1.100:3000/m/rcp?token=...`
   - Zaloguj się jako pracownik
   - Zezwól na dostęp do lokalizacji gdy przeglądarka o to poprosi
   - Kliknij **"Pobierz lokalizację"**
   - System pobierze rzeczywistą lokalizację GPS telefonu
   - Zarejestruj wejście/wyjście

3. **Testowanie geofence:**
   - **W obszarze** (< 100m od lokalizacji): rejestracja powinna się udać
   - **Poza obszarem** (> 100m): system odrzuci próbę z komunikatem o odległości

## Testy jednostkowe i integracyjne

### Backend

```bash
cd backend-v2

# Testy jednostkowe (Haversine, walidacja)
npm test -- rcp

# Testy integracyjne
npm test -- rcp.service.spec.ts
```

### Frontend (Playwright)

```bash
cd frontend-v2

# Uruchom testy E2E
npm run test:e2e

# Lub specyficzne testy RCP (po dodaniu)
npm run test:e2e -- rcp
```

## Scenariusze testowe

### ✅ Happy Path

1. **Manager generuje QR** → Kod QR wygenerowany
2. **Pracownik skanuje QR** → Przekierowanie do /m/rcp?token=...
3. **Pracownik loguje się** → Przekierowanie z powrotem do strony RCP
4. **Pracownik pobiera lokalizację** → Współrzędne pobrane, dokładność OK
5. **Pracownik w promieniu 100m** → Clock-in sukces
6. **Pracownik wychodzi** → Clock-out sukces

### ❌ Scenariusze błędów

1. **Pracownik poza geofence (> 100m)**:
   - Oczekiwany wynik: `RCP_OUTSIDE_GEOFENCE`
   - Komunikat: "Poza obszarem sklepu (Xm > 100m)"

2. **Niska dokładność GPS (> 100m)**:
   - Oczekiwany wynik: `RCP_LOW_ACCURACY`
   - Komunikat: "Dokładność lokalizacji jest zbyt niska"

3. **Double clock-in**:
   - Pracownik próbuje zarejestrować wejście dwa razy pod rząd
   - Oczekiwany wynik: `RCP_ALREADY_CLOCKED_IN`
   - Komunikat: "Jesteś już zalogowany. Najpierw zarejestruj wyjście."

4. **Token wygasł** (domyślnie po 1h):
   - Oczekiwany wynik: `RCP_TOKEN_EXPIRED`
   - Komunikat: "Token wygasł. Poproś kierownika o nowy kod QR"

5. **Rate limiting (> 3 próby w 60s)**:
   - Oczekiwany wynik: `RCP_RATE_LIMIT`
   - Komunikat: "Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie."

## Weryfikacja w bazie danych

```sql
-- Sprawdź logi audytowe
SELECT * FROM "AuditLog" 
WHERE action IN ('RCP_QR_GENERATE', 'RCP_CLOCK_IN', 'RCP_CLOCK_OUT', 'RCP_DENIED')
ORDER BY "createdAt" DESC;

-- Sprawdź wydarzenia RCP
SELECT 
  e.*,
  u."firstName",
  u."lastName",
  l.name as "locationName"
FROM "RcpEvent" e
JOIN "User" u ON e."userId" = u.id
JOIN "Location" l ON e."locationId" = l.id
ORDER BY e."happenedAt" DESC;

-- Sprawdź konfiguracje QR
SELECT 
  c.*,
  l.name as "locationName"
FROM "RcpQrConfig" c
JOIN "Location" l ON c."locationId" = l.id;
```

## Notatka o prywatności

System RCP przechowuje następujące dane:

- **Lokalizacja GPS pracownika** (tylko w momencie rejestracji)
- **Odległość od lokalizacji** (obliczona, w metrach)
- **Dokładność GPS** (opcjonalnie)
- **IP i User-Agent** (dla audytu)
- **Znacznik czasowy** (czas serwera + opcjonalnie czas klienta)

**Zalecenia**:
- Dane geolokalizacji powinny być przechowywane maksymalnie 24 miesiące (configurowalne)
- Pracownicy powinni być poinformowani o gromadzeniu danych lokalizacyjnych
- System zbiera minimalną ilość danych niezbędnych do weryfikacji obecności

## Troubleshooting

### Problem: Brak dostępu do lokalizacji w przeglądarce

**Rozwiązanie:**
- Chrome: Settings → Privacy and security → Site settings → Location → Allow
- Firefox: about:preferences#privacy → Permissions → Location → Settings
- Safari: Settings → Privacy → Location Services → Safari Websites

### Problem: Frontend nie może połączyć się z backendem

**Rozwiązanie:**
- Sprawdź czy backend działa: `curl http://localhost:4000/api/health`
- Sprawdź CORS w backendzie (plik `main.ts`)
- Sprawdź `NEXT_PUBLIC_API_URL` w `.env.local` frontendu

### Problem: Token zawsze wygasa

**Rozwiązanie:**
- Sprawdź konfigurację `tokenTtlSeconds` w tabeli `RcpQrConfig`
- Domyślnie: 3600s (1h), możesz zwiększyć do 86400s (24h)

### Problem: Geofence zawsze odrzuca (zbyt duża odległość)

**Rozwiązanie:**
- Sprawdź czy współrzędne lokalizacji są poprawne
- Użyj Google Maps aby zweryfikować: https://www.google.com/maps?q=52.2297,21.0122
- Zwiększ promień geofence (np. do 200m) w ustawieniach lokalizacji

## Kontakt

W przypadku problemów z testowaniem, skontaktuj się z zespołem rozwoju KadryHR.

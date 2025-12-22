# Wdrożenie Nowej Funkcjonalności Generowania Grafików

## 🚀 Szybkie Wdrożenie

### 1. Aktualizacja Kodu na Serwerze

```bash
# Przejdź do katalogu aplikacji
cd /home/deploy/apps/kadryhr-app

# Pobierz najnowsze zmiany
git pull origin main

# Zainstaluj zależności backendu (jeśli potrzebne)
cd backend
npm install

# Restart backendu
pm2 restart kadryhr-backend

# Sprawdź logi
pm2 logs kadryhr-backend --lines 50
```

### 2. Weryfikacja Wdrożenia

```bash
# Sprawdź czy backend działa
curl http://localhost:5000/

# Sprawdź nowe endpointy
curl http://localhost:5000/api/shift-templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 Checklist Wdrożenia

### Backend
- [ ] Kod zaktualizowany (`git pull`)
- [ ] Zależności zainstalowane (`npm install`)
- [ ] Backend zrestartowany (`pm2 restart`)
- [ ] Brak błędów w logach (`pm2 logs`)
- [ ] Nowe endpointy odpowiadają

### Baza Danych
- [ ] MongoDB działa (`systemctl status mongod`)
- [ ] Nowe kolekcje zostaną utworzone automatycznie przy pierwszym użyciu:
  - `employeeavailabilities`
  - `shifttemplates`
  - `scheduleconstraints`

### Testy
- [ ] Endpoint `/api/shift-templates` działa
- [ ] Endpoint `/api/availability` działa
- [ ] Endpoint `/api/schedule/generate-intelligent` działa

---

## 🎯 Pierwsze Kroki po Wdrożeniu

### 1. Utworzenie Szablonów Zmian

Zaloguj się jako admin i utwórz podstawowe szablony:

```bash
# Zmiana poranna
curl -X POST http://localhost:5000/api/shift-templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Zmiana poranna",
    "shiftType": "morning",
    "startTime": "08:00",
    "endTime": "16:00",
    "requiredStaff": 2,
    "color": "#3b82f6"
  }'

# Zmiana popołudniowa
curl -X POST http://localhost:5000/api/shift-templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Zmiana popołudniowa",
    "shiftType": "afternoon",
    "startTime": "14:00",
    "endTime": "22:00",
    "requiredStaff": 2,
    "color": "#f59e0b"
  }'

# Zmiana nocna
curl -X POST http://localhost:5000/api/shift-templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Zmiana nocna",
    "shiftType": "night",
    "startTime": "22:00",
    "endTime": "06:00",
    "requiredStaff": 1,
    "color": "#8b5cf6",
    "additionalCostMultiplier": 1.2
  }'
```

### 2. Aktualizacja Danych Pracowników

Dodaj umiejętności i preferencje do istniejących pracowników:

```bash
curl -X PUT http://localhost:5000/api/employees/EMPLOYEE_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "skills": ["kasjer", "obsługa", "magazyn"],
    "canWorkNights": true,
    "canWorkWeekends": true,
    "maxHoursPerDay": 8,
    "maxHoursPerWeek": 40,
    "preferredShifts": ["morning", "afternoon"]
  }'
```

### 3. Test Inteligentnego Generowania

Wygeneruj testowy grafik:

```bash
curl -X POST http://localhost:5000/api/schedule/generate-intelligent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "startDate": "2025-02-01",
    "endDate": "2025-02-07",
    "constraints": {
      "preferredStaffPerShift": 2,
      "allowOvertime": false,
      "prioritizeAvailability": true
    },
    "budget": 10000,
    "autoSave": false
  }'
```

---

## 📊 Monitorowanie

### Logi do Sprawdzenia

```bash
# Logi backendu
pm2 logs kadryhr-backend --lines 100

# Logi MongoDB
sudo tail -f /var/log/mongodb/mongod.log

# Logi Nginx
sudo tail -f /var/log/nginx/error.log
```

### Metryki do Monitorowania

- Czas odpowiedzi endpointów (szczególnie `/generate-intelligent`)
- Użycie pamięci backendu
- Liczba utworzonych grafików
- Liczba wykrytych naruszeń Kodeksu Pracy

---

## 🔧 Rozwiązywanie Problemów

### Problem: Backend nie startuje

```bash
# Sprawdź logi
pm2 logs kadryhr-backend --err --lines 50

# Sprawdź składnię
cd /home/deploy/apps/kadryhr-app/backend
node -c server.js

# Sprawdź MongoDB
sudo systemctl status mongod
```

### Problem: Endpoint zwraca 404

```bash
# Sprawdź czy routes są załadowane
pm2 logs kadryhr-backend | grep "ROUTES"

# Restart backendu
pm2 restart kadryhr-backend
```

### Problem: Błąd walidacji

```bash
# Sprawdź logi szczegółowe
pm2 logs kadryhr-backend --lines 200 | grep "validation"

# Sprawdź format danych wejściowych
```

---

## 📚 Dokumentacja

### Dla Użytkowników
- **SCHEDULE_GENERATION_GUIDE.md** - Kompletny przewodnik użytkownika
- **SCHEDULE_GENERATION_SUMMARY.md** - Podsumowanie funkcjonalności

### Dla Deweloperów
- Kod źródłowy w `/backend/utils/`
- Modele w `/backend/models/`
- API routes w `/backend/routes/`

---

## 🎓 Szkolenie Użytkowników

### Dla Administratorów

1. **Tworzenie szablonów zmian**
   - Przejdź do ustawień
   - Dodaj szablony dla typowych zmian
   - Ustaw wymagane umiejętności

2. **Generowanie grafików**
   - Wybierz zakres dat
   - Ustaw ograniczenia (budżet, nadgodziny)
   - Podgląd przed zapisem
   - Zapisz grafik

3. **Walidacja zgodności**
   - Sprawdź grafik pod kątem Kodeksu Pracy
   - Przejrzyj ostrzeżenia
   - Popraw naruszenia

### Dla Pracowników

1. **Zgłaszanie dostępności**
   - Otwórz aplikację mobilną
   - Przejdź do "Moja dostępność"
   - Zgłoś dyspozycyjność
   - Czekaj na zatwierdzenie

2. **Przeglądanie grafiku**
   - Zobacz swój grafik
   - Sprawdź nadgodziny
   - Otrzymuj powiadomienia o zmianach

---

## ✅ Potwierdzenie Wdrożenia

Po zakończeniu wdrożenia sprawdź:

- [ ] Backend działa bez błędów
- [ ] Wszystkie nowe endpointy odpowiadają
- [ ] Utworzono podstawowe szablony zmian
- [ ] Zaktualizowano dane pracowników
- [ ] Przetestowano generowanie grafiku
- [ ] Przetestowano walidację zgodności
- [ ] Przetestowano analizę kosztów
- [ ] Dokumentacja dostępna dla użytkowników

---

## 📞 Wsparcie

W razie problemów:

1. Sprawdź logi: `pm2 logs kadryhr-backend`
2. Sprawdź dokumentację: `SCHEDULE_GENERATION_GUIDE.md`
3. Sprawdź status: `pm2 status`

---

**Data wdrożenia:** _______________  
**Wdrożył:** _______________  
**Status:** ⬜ Sukces ⬜ Problemy (opisz poniżej)

**Notatki:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

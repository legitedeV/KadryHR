# ✅ KadryHR - Naprawione problemy

## 🔧 Poprawki wykonane:

### 1. Dashboard.jsx - naprawiono pobieranie danych pracownika
**Problem:** Dashboard używał `/employees/compact` i błędnej logiki `emp._id`
**Rozwiązanie:** Zmieniono na endpoint `/employees/me`

```diff
- const { data } = await api.get('/employees/compact');
- const employees = data.employees || [];
- return employees.find(emp => emp._id) || null;
+ const { data } = await api.get('/employees/me');
+ return data.employee || null;
```

### 2. Dashboard.jsx - naprawiono queryKey dla schedule
**Problem:** Query nie odświeżał się gdy currentEmployee się załadował
**Rozwiązanie:** Dodano `currentEmployee._id` do queryKey

```diff
- queryKey: ['schedule', isAdmin ? 'all' : 'user'],
+ queryKey: ['schedule', isAdmin ? 'all' : 'user', currentEmployee?._id],
```

### 3. Dashboard.jsx - naprawiono queryKey dla availability
**Problem:** Query nie odświeżał się gdy currentEmployee się załadował
**Rozwiązanie:** Dodano `currentEmployee._id` do queryKey

```diff
- queryKey: ['availability', 'user'],
+ queryKey: ['availability', 'user', currentEmployee?._id],
```

### 4. Dodano skrypty pomocnicze:

**backend/scripts/linkUserToEmployee.js**
- Automatycznie powiązuje test.pracownik@kadryhr.pl z pracownikiem
- Można użyć ręcznie: `node scripts/linkUserToEmployee.js email employee_id`

**backend/scripts/verifySetup.js**
- Weryfikuje konfigurację bazy danych
- Pokazuje które pracownicy nie mają powiązania z userem

## 🚀 Wdrożenie:

```bash
# Dodaj zmiany
git add .

# Commit
git commit -m "fix: dashboard employee data fetching and query dependencies

- Fixed Dashboard to use /employees/me endpoint
- Fixed queryKey dependencies for schedule and availability
- Added linkUserToEmployee.js script for user-employee linking
- Added verifySetup.js script for configuration verification"

# Push
git push origin main
```

## 🔧 Konfiguracja na VPS:

### Krok 1: Deploy
```bash
ssh deploy@vps-63e4449f
cd /home/deploy/apps/kadryhr-app
git pull origin main
./deploy.sh
```

### Krok 2: Powiąż użytkowników z pracownikami
```bash
cd /home/deploy/apps/kadryhr-app/backend

# Automatyczne powiązanie dla test user
node scripts/linkUserToEmployee.js

# Lub ręcznie dla konkretnego użytkownika
node scripts/linkUserToEmployee.js user@email.pl employee_id_here
```

### Krok 3: Weryfikacja
```bash
node scripts/verifySetup.js
```

Powinno pokazać:
```
✅ Połączono z MongoDB

👥 UŻYTKOWNICY: 2
   - admin@kadryhr.pl (admin)
   - test.pracownik@kadryhr.pl (user)

👷 PRACOWNICY: 1
   - Test Pracownik (Pracownik testowy) - ✅ powiązany z test.pracownik@kadryhr.pl

📅 WPISY W GRAFIKU: X

✅ Wszystko wygląda dobrze!
```

## 🧪 Testowanie:

### Test 1: Login jako user
```
1. Otwórz https://kadryhr.pl/login
2. Zaloguj: test.pracownik@kadryhr.pl / Test1234!
3. Powinno przekierować na /app
4. Sprawdź czy widoczny jest:
   ✅ Licznik do następnej zmiany
   ✅ Moje najbliższe zmiany
   ✅ Formularz "Sugestie dyspozycyjności"
```

### Test 2: Formularz dostępności
```
1. Wypełnij formularz:
   - Od: 2025-01-01
   - Do: 2025-01-31
   - Dni: Pon-Pt (domyślnie zaznaczone)
   - Typ: Dostępny
2. Kliknij "Zgłoś dostępność"
3. Powinien pojawić się komunikat sukcesu
4. Zgłoszenie powinno pojawić się na liście ze statusem "Oczekuje"
```

### Test 3: Login jako admin
```
1. Zaloguj jako admin
2. Sprawdź Dashboard:
   ✅ Metryki (pracownicy, wynagrodzenia)
   ✅ Wszystkie zmiany (nie tylko swoje)
   ✅ Szybkie akcje
   ✅ Licznik do następnej zmiany
```

## 🐛 Możliwe problemy i rozwiązania:

### Problem 1: "Brak przypisanego profilu pracownika"
**Przyczyna:** Employee nie ma pola `user` ustawionego
**Rozwiązanie:**
```bash
node scripts/linkUserToEmployee.js
```

### Problem 2: Dashboard użytkownika pusty
**Przyczyna:** Brak zmian w grafiku dla tego pracownika
**Rozwiązanie:**
```bash
# Jako admin, dodaj zmianę w grafiku dla pracownika testowego
# Lub użyj ScheduleBuilder → Inteligentny grafik
```

### Problem 3: Endpoint /me zwraca 404
**Przyczyna:** Backend nie ma nowego kodu
**Rozwiązanie:**
```bash
cd /home/deploy/apps/kadryhr-app
git pull origin main
pm2 restart kadryhr-backend
```

### Problem 4: Kolory nadal indigo
**Przyczyna:** Cache przeglądarki
**Rozwiązanie:**
```
Ctrl+Shift+R (hard refresh)
lub tryb incognito
```

## ✅ Checklist:

- [ ] Wykonano `git pull origin main` na VPS
- [ ] Wykonano `./deploy.sh`
- [ ] Uruchomiono `node scripts/linkUserToEmployee.js`
- [ ] Uruchomiono `node scripts/verifySetup.js`
- [ ] Zalogowano jako user - Dashboard działa
- [ ] Formularz dostępności wysyła dane
- [ ] Licznik się aktualizuje co sekundę
- [ ] Kolory są pink/rose

## 📊 Podsumowanie zmian:

**Pliki zmodyfikowane:** 7
- frontend/src/App.jsx
- frontend/src/pages/Dashboard.jsx (+ 3 poprawki)
- frontend/src/components/Navbar.jsx
- frontend/src/pages/SelfService.jsx
- backend/routes/employeeRoutes.js
- backend/scripts/linkUserToEmployee.js (nowy)
- backend/scripts/verifySetup.js (nowy)

**Nowe funkcje:** 5
- Licznik do następnej zmiany
- Sugestie dostępności
- Dashboard dla user/admin
- Endpoint /me
- Skrypty pomocnicze

**Poprawione bugi:** 6
- Routing /app
- Duplikat /self-service
- Navbar duplikaty
- Dashboard queryKey dependencies
- Employee data fetching
- Kolory indigo → pink/rose

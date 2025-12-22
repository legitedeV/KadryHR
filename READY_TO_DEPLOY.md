# 🚀 KadryHR - Gotowe pliki do wdrożenia

## 📋 Spis zmian

### ✨ Nowe funkcje:
1. **Licznik do następnej zmiany** - real-time countdown (dni:godz:min:sek)
2. **Sugestie dostępności** - użytkownicy mogą zgłaszać preferowane okna czasowe
3. **Unified Dashboard** - jeden widok dla admin i user, treść dostosowana do roli
4. **Endpoint `/me`** - użytkownik może pobrać swój profil pracownika

### 🎨 Zmiany stylistyczne:
- Wszystkie kolory `indigo-*` zamienione na `pink-*` / `rose-*`
- Przyciski używają gradientu `from-pink-500 to-rose-500`
- Focus rings: `ring-pink-500`
- Pełna spójność z landing page

### 🔧 Poprawki:
- Usunięto duplikat trasy `/self-service`
- Trasa `/app` dostępna dla wszystkich zalogowanych
- AdminRoute przekierowuje na `/app` zamiast `/self-service`
- Navbar bez duplikatów linków

---

## 📁 Pliki do skopiowania

### 1️⃣ `frontend/src/App.jsx`

**Lokalizacja:** `frontend_src_App.jsx`

**Zmiany:**
- `/app` używa `PrivateRoute` zamiast `AdminRoute`
- Usunięto duplikat `/self-service`
- AdminRoute przekierowuje na `/app`
- Kolory loadera: pink/rose

**Jak skopiować:**
```bash
cat frontend_src_App.jsx > frontend/src/App.jsx
```

---

### 2️⃣ `frontend/src/pages/Dashboard.jsx`

**Lokalizacja:** `frontend_src_pages_Dashboard.jsx`

**Zmiany:**
- Całkowicie nowy plik
- Licznik do następnej zmiany (real-time)
- Widok dla admina: metryki, wszystkie zmiany, szybkie akcje
- Widok dla usera: moje zmiany, formularz dostępności, zgłoszenia
- Wszystkie kolory pink/rose

**Jak skopiować:**
```bash
cat frontend_src_pages_Dashboard.jsx > frontend/src/pages/Dashboard.jsx
```

---

### 3️⃣ `frontend/src/components/Navbar.jsx`

**Lokalizacja:** `frontend_src_components_Navbar.jsx`

**Zmiany:**
- Kolory: indigo → pink/rose
- User badge: `text-pink-600`
- Przyciski: gradient pink/rose
- Mobile menu: pink akcenty

**Jak skopiować:**
```bash
cat frontend_src_components_Navbar.jsx > frontend/src/components/Navbar.jsx
```

---

### 4️⃣ `frontend/src/pages/SelfService.jsx`

**Lokalizacja:** `frontend_src_pages_SelfService.jsx`

**Zmiany:**
- Wszystkie przyciski: gradient pink/rose
- Focus rings: pink-500
- Akcenty tekstowe: pink-700
- Badges: pink-700

**Jak skopiować:**
```bash
cat frontend_src_pages_SelfService.jsx > frontend/src/pages/SelfService.jsx
```

---

### 5️⃣ `backend/routes/employeeRoutes.js`

**Lokalizacja:** `backend_routes_employeeRoutes.js`

**Zmiany:**
- Dodano endpoint `GET /api/employees/me`
- Zwraca profil pracownika dla zalogowanego użytkownika
- Używa `employee.user === req.user.id`

**Jak skopiować:**
```bash
cat backend_routes_employeeRoutes.js > backend/routes/employeeRoutes.js
```

---

## 🚀 Szybkie wdrożenie (copy-paste)

### Na lokalnym komputerze (w katalogu projektu):

```bash
# Skopiuj pliki z sandbox
cp /vercel/sandbox/frontend_src_App.jsx frontend/src/App.jsx
cp /vercel/sandbox/frontend_src_pages_Dashboard.jsx frontend/src/pages/Dashboard.jsx
cp /vercel/sandbox/frontend_src_components_Navbar.jsx frontend/src/components/Navbar.jsx
cp /vercel/sandbox/frontend_src_pages_SelfService.jsx frontend/src/pages/SelfService.jsx
cp /vercel/sandbox/backend_routes_employeeRoutes.js backend/routes/employeeRoutes.js

# Commit
git add .
git commit -m "feat: unified dashboard with availability suggestions and pink/rose theme"
git push origin main
```

### Na VPS:

```bash
ssh deploy@vps-63e4449f
cd /home/deploy/apps/kadryhr-app
git pull origin main
./deploy.sh
```

---

## 🧪 Checklist testowania

### ✅ Routing:
- [ ] Admin login → `/app` (widzi metryki)
- [ ] User login → `/app` (widzi formularz dostępności)
- [ ] User próbuje wejść na `/employees` → przekierowanie na `/app`
- [ ] Navbar dla admina → wszystkie linki
- [ ] Navbar dla usera → tylko Dashboard i Panel pracownika

### ✅ Dashboard:
- [ ] Licznik do następnej zmiany → aktualizuje się co sekundę
- [ ] Admin widzi: metryki (pracownicy, wynagrodzenia)
- [ ] User widzi: formularz dostępności
- [ ] Formularz dostępności → wysyła do `/api/availability`
- [ ] Lista zgłoszeń dostępności → pokazuje status (pending/approved/rejected)

### ✅ Kolory:
- [ ] Wszystkie przyciski primary → pink/rose gradient
- [ ] Aktywne linki → pink-100 tło
- [ ] Focus na inputach → pink-500 ring
- [ ] User badge → pink-600 tekst
- [ ] Loader → pink-600 border

### ✅ SelfService:
- [ ] Przyciski → pink/rose gradient
- [ ] Focus rings → pink-500
- [ ] Statusy → pink-700

---

## 📊 API Endpoints - dokumentacja

### Nowy endpoint:

#### `GET /api/employees/me`
Zwraca profil pracownika dla zalogowanego użytkownika.

**Auth:** Required (protect middleware)

**Response:**
```json
{
  "employee": {
    "_id": "...",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "position": "Kasjer",
    "hourlyRate": 25,
    "isActive": true,
    "user": "user_id_here"
  }
}
```

**Error 404:**
```json
{
  "message": "Brak przypisanego profilu pracownika do tego użytkownika."
}
```

### Używane endpointy:

#### `POST /api/availability`
Zgłoszenie dostępności przez użytkownika.

**Body:**
```json
{
  "employeeId": "...",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "preferredStartTime": "08:00",
  "preferredEndTime": "16:00",
  "maxHoursPerDay": 8,
  "maxHoursPerWeek": 40,
  "type": "available",
  "notes": "Preferuję poranki"
}
```

**Response:**
```json
{
  "_id": "...",
  "employee": "...",
  "status": "pending",
  ...
}
```

#### `GET /api/availability?employeeId=X`
Lista zgłoszeń dostępności.

**Response:**
```json
[
  {
    "_id": "...",
    "employee": { ... },
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "status": "pending",
    "type": "available",
    ...
  }
]
```

#### `GET /api/schedule?employeeId=X&from=Y&to=Z`
Grafik dla konkretnego pracownika w zakresie dat.

**Response:**
```json
[
  {
    "_id": "...",
    "employee": { ... },
    "date": "2025-01-15",
    "startTime": "08:00",
    "endTime": "16:00",
    "type": "regular"
  }
]
```

---

## 🎯 Następne kroki (sugestie)

### Priorytet WYSOKI:
1. **Powiązanie user → employee** - upewnij się, że każdy user ma przypisany employee.user
2. **Testowanie dostępności** - sprawdź czy formularz działa end-to-end
3. **Walidacja dat** - dodaj walidację, że endDate >= startDate

### Priorytet ŚREDNI:
4. **Kalendarz miesięczny** - wizualizacja grafiku w formie kalendarza
5. **Powiadomienia o zmianach** - notify user gdy admin zmieni grafik
6. **Eksport do PDF** - raport godzin dla użytkownika

### Priorytet NISKI:
7. **Dark mode** - opcjonalny tryb ciemny
8. **Animacje** - płynne przejścia między widokami
9. **Mobile app** - integracja z aplikacją mobilną

---

## 🐛 Znane problemy i rozwiązania

### Problem 1: User nie ma przypisanego employee
**Objaw:** Dashboard użytkownika nie pokazuje zmian

**Rozwiązanie:**
```javascript
// W backend/scripts/linkUserToEmployee.js
const User = require('../models/User');
const Employee = require('../models/Employee');

async function linkUserToEmployee(userEmail, employeeId) {
  const user = await User.findOne({ email: userEmail });
  const employee = await Employee.findById(employeeId);
  
  if (!user || !employee) {
    console.error('User lub Employee nie istnieje');
    return;
  }
  
  employee.user = user._id;
  await employee.save();
  
  console.log(`Powiązano ${user.email} z ${employee.firstName} ${employee.lastName}`);
}

// Użycie:
linkUserToEmployee('test.pracownik@kadryhr.pl', 'employee_id_here');
```

### Problem 2: Endpoint `/me` zwraca 404
**Objaw:** Dashboard użytkownika nie ładuje danych

**Rozwiązanie:**
1. Sprawdź czy employee ma pole `user` ustawione
2. Sprawdź czy `employee.isActive === true`
3. Sprawdź logi backendu: `pm2 logs kadryhr-backend`

### Problem 3: Kolory się nie zmieniły
**Objaw:** Nadal widać indigo zamiast pink

**Rozwiązanie:**
1. Wyczyść cache przeglądarki (Ctrl+Shift+R)
2. Sprawdź czy build się wykonał: `cd frontend && npm run build`
3. Sprawdź czy nginx serwuje nowy build: `ls -la frontend/dist`

---

## 📞 Wsparcie

Jeśli coś nie działa:
1. Sprawdź logi backendu: `pm2 logs kadryhr-backend`
2. Sprawdź logi frontendu: `pm2 logs kadryhr-frontend` (jeśli używasz pm2)
3. Sprawdź console w przeglądarce (F12)
4. Sprawdź network tab - czy API zwraca błędy

---

## ✅ Potwierdzenie wdrożenia

Po wdrożeniu sprawdź:

```bash
# Na VPS
curl -X GET http://localhost:5000/api/employees/me \
  -H "Cookie: jwt=YOUR_TOKEN_HERE"

# Powinno zwrócić:
# {"employee": {...}} lub {"message": "Brak przypisanego profilu..."}
```

W przeglądarce:
1. Zaloguj się jako user
2. Otwórz DevTools (F12) → Console
3. Powinny być logi: `[Dashboard] Pobieranie danych...`
4. Sprawdź czy licznik się aktualizuje co sekundę

---

**Wszystkie pliki są gotowe do ctrl+c ctrl+v. Powodzenia! 🎉**

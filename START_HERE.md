# 🚀 KadryHR - START HERE

## 📌 Szybki start

Masz 5 plików gotowych do wdrożenia. Wszystkie są w katalogu `/vercel/sandbox/`.

---

## 📁 Pliki do skopiowania

### Frontend (4 pliki):
1. **`frontend_src_App.jsx`** → `frontend/src/App.jsx`
2. **`frontend_src_pages_Dashboard.jsx`** → `frontend/src/pages/Dashboard.jsx`
3. **`frontend_src_components_Navbar.jsx`** → `frontend/src/components/Navbar.jsx`
4. **`frontend_src_pages_SelfService.jsx`** → `frontend/src/pages/SelfService.jsx`

### Backend (1 plik):
5. **`backend_routes_employeeRoutes.js`** → `backend/routes/employeeRoutes.js`

---

## ⚡ Szybkie wdrożenie (3 kroki)

### Krok 1: Skopiuj pliki

Otwórz plik **`ALL_FILES_READY.md`** - zawiera wszystkie 5 plików z pełnym kodem gotowym do ctrl+c ctrl+v.

Dla każdego pliku:
1. Znajdź sekcję (np. "Plik 1: frontend/src/App.jsx")
2. Skopiuj cały blok kodu (od \`\`\`jsx do \`\`\`)
3. Wklej do odpowiedniego pliku w swoim projekcie
4. Zapisz

### Krok 2: Commit i push

```bash
git add frontend/src/App.jsx frontend/src/pages/Dashboard.jsx frontend/src/components/Navbar.jsx frontend/src/pages/SelfService.jsx backend/routes/employeeRoutes.js

git commit -m "feat: unified dashboard, availability suggestions, pink/rose theme"

git push origin main
```

### Krok 3: Deploy

```bash
ssh deploy@vps-63e4449f
cd /home/deploy/apps/kadryhr-app
git pull origin main
./deploy.sh
```

---

## ✨ Co się zmieni po wdrożeniu

### Dla admina:
- ✅ Login → przekierowanie na `/app`
- ✅ Dashboard pokazuje: metryki, wszystkie zmiany, szybkie akcje
- ✅ Licznik do następnej zmiany (real-time)
- ✅ Navbar: wszystkie linki widoczne (Dashboard, Panel pracownika, Pracownicy, Kalkulator, Raporty, Grafik miesięczny, Zaproszenia)
- ✅ Kolory: pink/rose gradient (jak landing page)

### Dla użytkownika:
- ✅ Login → przekierowanie na `/app`
- ✅ Dashboard pokazuje: moje zmiany, formularz dostępności, powiadomienia
- ✅ Licznik do następnej zmiany (real-time)
- ✅ Formularz zgłaszania dostępności (tydzień/miesiąc)
- ✅ Lista zgłoszeń ze statusami (pending/approved/rejected)
- ✅ Navbar: tylko Dashboard i Panel pracownika
- ✅ Kolory: pink/rose gradient (jak landing page)

---

## 📚 Dokumentacja

### Główne pliki:
- **`ALL_FILES_READY.md`** - wszystkie 5 plików z kodem (CTRL+C CTRL+V)
- **`CHANGES_DIFF.md`** - szczegółowe diff'y wszystkich zmian
- **`READY_TO_DEPLOY.md`** - instrukcje wdrożenia i troubleshooting
- **`FINAL_SUMMARY.md`** - pełne podsumowanie z API docs i sugestiami

### Pomocnicze:
- **`IMPLEMENTATION_SUMMARY.md`** - przegląd zmian i testów
- **`START_HERE.md`** - ten plik (szybki start)

---

## 🎯 Najważniejsze zmiany

### 1. Routing
```
PRZED: Admin → /app, User → /self-service
PO:    Admin → /app, User → /app (Dashboard dostosowuje widok)
```

### 2. Dashboard
```
PRZED: Tylko dla admina, metryki i powiadomienia
PO:    Dla wszystkich, dostosowany do roli:
       - Admin: metryki + wszystkie zmiany + szybkie akcje
       - User: moje zmiany + formularz dostępności + zgłoszenia
```

### 3. Licznik do następnej zmiany
```
Nowa funkcja dla wszystkich użytkowników:
- Pokazuje dni:godz:min:sek do następnej zmiany
- Aktualizuje się co sekundę
- Gradient pink/rose w tle
```

### 4. Sugestie dostępności
```
Nowa funkcja dla użytkowników:
- Formularz zgłaszania preferowanej dostępności
- Pola: zakres dat, dni tygodnia, godziny, max godz
- Typy: dostępny, preferowany, niedostępny, ograniczony
- Status: pending → wymaga zatwierdzenia przez admina
```

### 5. Kolory
```
PRZED: indigo-* (niebieski)
PO:    pink-* / rose-* (różowy gradient)
```

---

## 🔧 Wymagania techniczne

### Aby wszystko działało, upewnij się że:

1. **Backend ma endpoint `/api/availability`**
   - Sprawdź: `backend/routes/availabilityRoutes.js` istnieje
   - Sprawdź: `backend/server.js` ma `app.use('/api/availability', availabilityRoutes)`

2. **Model EmployeeAvailability istnieje**
   - Sprawdź: `backend/models/EmployeeAvailability.js` istnieje

3. **Employee ma pole `user`**
   - Sprawdź w bazie: `db.employees.findOne({ user: { $exists: true } })`
   - Jeśli brak, powiąż ręcznie (instrukcje w READY_TO_DEPLOY.md)

4. **Frontend ma @tanstack/react-query**
   - Sprawdź: `frontend/package.json` zawiera `@tanstack/react-query`

---

## 🆘 Pomoc

### Jeśli coś nie działa:

1. **Sprawdź logi backendu:**
   ```bash
   pm2 logs kadryhr-backend --lines 100
   ```

2. **Sprawdź console w przeglądarce:**
   - F12 → Console
   - Szukaj błędów (czerwone linie)

3. **Sprawdź network tab:**
   - F12 → Network
   - Odśwież stronę
   - Sprawdź czy API zwraca błędy (status 4xx, 5xx)

4. **Sprawdź czy build się wykonał:**
   ```bash
   cd frontend
   npm run build
   ls -la dist/
   ```

5. **Wyczyść cache:**
   - Ctrl+Shift+R (hard refresh)
   - Lub tryb incognito

---

## 📞 Kontakt

Jeśli potrzebujesz pomocy:
1. Sprawdź **`READY_TO_DEPLOY.md`** - sekcja "Troubleshooting"
2. Sprawdź **`FINAL_SUMMARY.md`** - sekcja "Troubleshooting"
3. Sprawdź logi: `pm2 logs kadryhr-backend`

---

## ✅ Checklist wdrożenia

- [ ] Skopiowałem wszystkie 5 plików
- [ ] Wykonałem `git add` i `git commit`
- [ ] Wykonałem `git push origin main`
- [ ] Zalogowałem się na VPS
- [ ] Wykonałem `git pull origin main`
- [ ] Wykonałem `./deploy.sh`
- [ ] Sprawdziłem logi: `pm2 logs kadryhr-backend`
- [ ] Otworzyłem stronę w przeglądarce
- [ ] Zalogowałem się jako admin - działa ✅
- [ ] Zalogowałem się jako user - działa ✅
- [ ] Licznik się aktualizuje - działa ✅
- [ ] Formularz dostępności wysyła dane - działa ✅
- [ ] Kolory są pink/rose - działa ✅

---

## 🎉 Gotowe!

**Wszystkie pliki są w `/vercel/sandbox/` i gotowe do wdrożenia.**

**Główny plik z kodem: `ALL_FILES_READY.md`**

**Powodzenia! 🚀**

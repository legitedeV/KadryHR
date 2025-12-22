# KadryHR - Zmiany Frontend i Backend

## Plik 1: `frontend/src/App.jsx`

### ZMIANA 1: Trasa `/app` - z AdminRoute na PrivateRoute

```diff
--- PRZED
+++ PO

       <Route path="/register" element={<Register />} />
       <Route
         path="/app"
         element={
-          <AdminRoute>
+          <PrivateRoute>
             <Layout>
               <Dashboard />
             </Layout>
-          </AdminRoute>
+          </PrivateRoute>
         }
       />
```

**Wyjaśnienie:** Teraz wszyscy zalogowani użytkownicy (admin i user) mają dostęp do `/app`. Dashboard sam dostosowuje widok w zależności od roli.

### ZMIANA 2: Usunięcie duplikatu trasy `/self-service`

```diff
--- PRZED
+++ PO

       <Route
         path="/self-service"
         element={
           <PrivateRoute>
             <Layout>
               <SelfService />
             </Layout>
           </PrivateRoute>
         }
       />
-      <Route
-        path="/self-service"
-        element={
-          <PrivateRoute>
-            <Layout>
-              <SelfService />
-            </Layout>
-          </PrivateRoute>
-        }
-      />
```

**Wyjaśnienie:** Usunięto zduplikowaną definicję trasy.

### ZMIANA 3: AdminRoute - przekierowanie na `/app` zamiast `/self-service`

```diff
--- PRZED
+++ PO

   if (!user) return <Navigate to="/login" replace />;
-  if (user.role !== 'admin' && user.role !== 'super_admin') return <Navigate to="/self-service" replace />;
+  if (user.role !== 'admin' && user.role !== 'super_admin') {
+    return <Navigate to="/app" replace />;
+  }

   return children;
 };
```

**Wyjaśnienie:** Użytkownicy bez uprawnień admina są przekierowywani na `/app` (gdzie Dashboard dostosuje widok), nie na `/self-service`.

### ZMIANA 4: Kolory loadera - indigo → pink

```diff
--- PRZED
+++ PO

 const PrivateRoute = ({ children }) => {
   const { user, loading } = useAuth();
   
   if (loading) {
     return (
-      <div className="min-h-screen flex items-center justify-center bg-slate-50">
+      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50">
         <div className="text-center">
-          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
+          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
           <p className="mt-4 text-sm text-slate-600">Ładowanie...</p>
         </div>
       </div>
     );
   }
```

**Wyjaśnienie:** Loader używa teraz kolorów pink/rose zgodnych z landing page.

---

## Plik 2: `frontend/src/pages/Dashboard.jsx`

### CAŁKOWITA PRZEBUDOWA - Nowy plik

**Nowe funkcje:**

1. **Licznik do następnej zmiany** - dla wszystkich użytkowników
   - Wyświetla dni, godziny, minuty, sekundy do następnej zmiany
   - Aktualizuje się co sekundę
   - Gradient pink/rose w tle

2. **Widok dla użytkownika (role: 'user'):**
   - Moje najbliższe zmiany (filtrowane po employeeId)
   - Formularz zgłaszania dostępności (availability suggestions)
   - Lista zgłoszonych dostępności ze statusami
   - Powiadomienia

3. **Widok dla admina (role: 'admin'):**
   - Metryki agregowane (StatCard)
   - Wszystkie nadchodzące zmiany
   - Urlopy i L4 do zatwierdzenia
   - Szybkie akcje
   - Powiadomienia

**Kluczowe zmiany kolorystyczne:**
- Wszystkie `indigo-*` → `pink-*` / `rose-*`
- Przyciski: `bg-gradient-to-r from-pink-500 to-rose-500`
- Focus rings: `focus:ring-pink-500`
- Akcenty: `text-pink-600`, `text-pink-700`

**Nowe API calls:**
```javascript
// Dla użytkownika - pobranie własnego profilu pracownika
GET /api/employees/me

// Dla użytkownika - pobranie grafiku filtrowanego
GET /api/schedule?employeeId=X&from=Y&to=Z

// Zgłoszenie dostępności
POST /api/availability
{
  employeeId, startDate, endDate, daysOfWeek,
  preferredStartTime, preferredEndTime,
  maxHoursPerDay, maxHoursPerWeek, type, notes
}

// Lista zgłoszeń dostępności
GET /api/availability?employeeId=X
```

---

## Plik 3: `frontend/src/components/Navbar.jsx`

### ZMIANA: Kolory - indigo → pink/rose

```diff
--- PRZED (mobile user badge)
+++ PO

           {user && (
             <div className="text-right">
               <div className="text-[11px] font-semibold text-slate-900 truncate max-w-[110px]">
                 {user.name}
               </div>
-              <div className="text-[10px] uppercase tracking-wide text-indigo-600">
+              <div className="text-[10px] uppercase tracking-wide text-pink-600">
                 {user.role === 'admin' ? 'ADMIN' : 'UŻYTKOWNIK'}
               </div>
             </div>
           )}
```

**Wyjaśnienie:** Wszystkie akcenty kolorystyczne zmienione na pink/rose.

---

## Plik 4: `frontend/src/pages/SelfService.jsx`

### ZMIANA 1: Przyciski - indigo → pink gradient

```diff
--- PRZED (przycisk "Dodaj sugestię")
+++ PO

           <button
             type="button"
             onClick={() => suggestionMutation.mutate(suggestionPayload)}
             disabled={suggestionMutation.isLoading}
-            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
+            className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white hover:shadow-md disabled:opacity-60"
           >
             {suggestionMutation.isLoading ? 'Wysyłanie...' : 'Dodaj sugestię'}
           </button>
```

### ZMIANA 2: Przycisk urlopu - emerald → pink gradient

```diff
--- PRZED
+++ PO

           <button
             type="button"
             onClick={() => leaveMutation.mutate(leavePayload)}
             disabled={leaveMutation.isLoading}
-            className="w-full rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
+            className="w-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white hover:shadow-md disabled:opacity-60"
           >
             {leaveMutation.isLoading ? 'Wysyłanie...' : 'Złóż wniosek urlopowy'}
           </button>
```

### ZMIANA 3: Przycisk zamiany - indigo → pink gradient

```diff
--- PRZED
+++ PO

           <button
             type="button"
             onClick={() => swapMutation.mutate(swapPayload)}
             disabled={swapMutation.isLoading}
-            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
+            className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white hover:shadow-md disabled:opacity-60"
           >
             {swapMutation.isLoading ? 'Wysyłanie...' : 'Poproś o zamianę'}
           </button>
```

### ZMIANA 4: Focus rings - indigo → pink

```diff
--- PRZED (wszystkie inputy i selecty)
+++ PO

-            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
+            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
```

### ZMIANA 5: Akcenty tekstowe - indigo → pink

```diff
--- PRZED
+++ PO

-          <span className="text-[11px] font-semibold text-indigo-700">Grafik</span>
+          <span className="text-[11px] font-semibold text-pink-700">Grafik</span>

-                <span className="text-[11px] font-semibold text-indigo-700">{item.status}</span>
+                <span className="text-[11px] font-semibold text-pink-700">{item.status}</span>

-                <span className="text-[11px] font-semibold text-indigo-700">{swap.status}</span>
+                <span className="text-[11px] font-semibold text-pink-700">{swap.status}</span>
```

---

## Plik 5: `backend/routes/employeeRoutes.js`

### DODANIE: Nowy endpoint `/me`

```diff
--- PRZED
+++ PO

 // uproszczona lista do wyborów (np. zamiany w grafiku)
 router.get(
   '/compact',
   protect,
   asyncHandler(async (req, res) => {
     const employees = await Employee.find(
       {},
       'firstName lastName position isActive'
     ).sort({ firstName: 1 });

     res.json({ employees });
   })
 );

+/**
+ * GET /api/employees/me
+ * Dane powiązanego pracownika dla aktualnie zalogowanego użytkownika
+ */
+router.get(
+  '/me',
+  protect,
+  asyncHandler(async (req, res) => {
+    const { id: userId } = req.user || {};
+
+    const employee = await Employee.findOne({ user: userId, isActive: true });
+
+    if (!employee) {
+      return res.status(404).json({
+        message: 'Brak przypisanego profilu pracownika do tego użytkownika.',
+      });
+    }
+
+    res.json({ employee });
+  })
+);

 /**
  * GET /api/employees
  * Lista wszystkich pracowników
  */
```

**Wyjaśnienie:** Nowy endpoint pozwala użytkownikowi pobrać swój profil pracownika na podstawie powiązania `employee.user === req.user.id`.

---

## Podsumowanie zmian

### Frontend:
1. ✅ **App.jsx** - routing dostosowany, `/app` dla wszystkich, usunięto duplikat
2. ✅ **Dashboard.jsx** - całkowicie nowy, z licznikiem, dostępnością, widokami dla admin/user
3. ✅ **Navbar.jsx** - kolory pink/rose
4. ✅ **SelfService.jsx** - kolory pink/rose

### Backend:
1. ✅ **employeeRoutes.js** - dodano endpoint `/me` dla użytkowników

### Kolory zmienione globalnie:
- `indigo-50` → `pink-50`
- `indigo-100` → `pink-100`
- `indigo-200` → `pink-200`
- `indigo-500` → `pink-500` / `rose-500` (gradient)
- `indigo-600` → `pink-600` / `rose-600` (gradient)
- `indigo-700` → `pink-700`

### Nowe funkcje:
1. **Licznik do następnej zmiany** - real-time countdown
2. **Sugestie dostępności** - formularz dla użytkowników
3. **Widok dostosowany do roli** - Dashboard pokazuje różne treści dla admin/user
4. **Endpoint `/me`** - użytkownik może pobrać swój profil pracownika

---

## Instrukcja wdrożenia

### 1. Skopiuj pliki:

```bash
# Frontend
cp frontend_src_App.jsx frontend/src/App.jsx
cp frontend_src_pages_Dashboard.jsx frontend/src/pages/Dashboard.jsx
cp frontend_src_components_Navbar.jsx frontend/src/components/Navbar.jsx
cp frontend_src_pages_SelfService.jsx frontend/src/pages/SelfService.jsx

# Backend
cp backend_routes_employeeRoutes.js backend/routes/employeeRoutes.js
```

### 2. Commit i push:

```bash
git add frontend/src/App.jsx frontend/src/pages/Dashboard.jsx frontend/src/components/Navbar.jsx frontend/src/pages/SelfService.jsx backend/routes/employeeRoutes.js
git commit -m "feat: unified dashboard, availability suggestions, pink/rose color scheme

- Changed /app route to PrivateRoute (accessible to all users)
- Dashboard now adapts to user role (admin vs user)
- Added next shift countdown widget
- Added availability suggestions form for users
- Updated all colors from indigo to pink/rose gradient
- Added /api/employees/me endpoint for user profile
- Removed duplicate /self-service route
- Fixed navbar color scheme to match landing page"

git push origin main
```

### 3. Deploy na VPS:

```bash
ssh deploy@vps-63e4449f
cd /home/deploy/apps/kadryhr-app
git pull origin main
./deploy.sh
```

### 4. Testowanie:

**Jako admin:**
- Login → przekierowanie na `/app`
- Widoczne: metryki, wszystkie zmiany, szybkie akcje
- Navbar: wszystkie linki (Dashboard, Panel pracownika, Pracownicy, Kalkulator, Raporty, Grafik miesięczny, Zaproszenia)

**Jako user:**
- Login → przekierowanie na `/app`
- Widoczne: licznik do następnej zmiany, moje zmiany, formularz dostępności
- Navbar: Dashboard, Panel pracownika (bez linków admina)

---

## Sugestie dalszych ulepszeń

### 1. **Kalendarz miesięczny (widok siatki)**
Dodaj komponent kalendarza pokazujący cały miesiąc z zaznaczonymi zmianami:
```javascript
// Komponent MonthlyCalendar.jsx
- Siatka 7x5 (dni tygodnia x tygodnie)
- Podświetlenie dni ze zmianami
- Kliknięcie dnia → szczegóły zmiany
- Kolory: pink dla zmian, rose dla nadgodzin
```

### 2. **Powiadomienia push**
Integracja z Web Push API:
```javascript
// Endpoint: POST /api/notifications/subscribe
- Zapisz subscription w bazie
- Wysyłaj powiadomienia o nowych zmianach
- Powiadomienia o zatwierdzonych urlopach
```

### 3. **Eksport grafiku do kalendarza**
```javascript
// Endpoint: GET /api/schedule/export/ical
- Generuj plik .ics
- Użytkownik może dodać do Google Calendar / Outlook
```

### 4. **Statystyki dla użytkownika**
Dodaj do Dashboard (widok user):
```javascript
- Przepracowane godziny w tym miesiącu
- Pozostałe dni urlopu
- Średnia godzin tygodniowo
- Wykres godzin (ostatnie 4 tygodnie)
```

### 5. **Zamiany zmian - workflow**
Rozbuduj funkcję swap requests:
```javascript
- Użytkownik A prosi o zamianę z B
- B dostaje powiadomienie i może zaakceptować/odrzucić
- Po akceptacji przez B, admin zatwierdza finalnie
- Automatyczna aktualizacja grafiku
```

### 6. **Aplikacja mobilna - integracja**
```javascript
// Endpoint: POST /api/mobile/clock-in
- Geo-fencing (sprawdzenie lokalizacji)
- Zdjęcie selfie (opcjonalnie)
- Automatyczne rozpoczęcie zmiany
```

### 7. **Raporty dla użytkownika**
Dodaj zakładkę "Moje raporty":
```javascript
- Zestawienie godzin (miesięczne/roczne)
- Historia urlopów
- Historia zmian
- Eksport do PDF
```

### 8. **Dark mode**
```javascript
// Dodaj toggle w Navbar
- Zapisz preferencję w localStorage
- Użyj Tailwind dark: variants
- Gradient dark mode: from-pink-900 to-rose-900
```

### 9. **Optymalizacja UX**
```javascript
- Skeleton loaders zamiast "Ładowanie..."
- Toast notifications (react-hot-toast)
- Animacje przejść między zakładkami
- Lazy loading dla dużych list
```

### 10. **Walidacja formularzy**
```javascript
// Użyj react-hook-form + zod
- Walidacja po stronie klienta
- Lepsze komunikaty błędów
- Disabled state dla nieprawidłowych formularzy
```

---

## Mapowanie kolorów (pełna lista)

| Stary (indigo) | Nowy (pink/rose) | Użycie |
|---|---|---|
| `bg-indigo-50` | `bg-pink-50` | Tła kart, hover states |
| `bg-indigo-100` | `bg-pink-100` | Aktywne linki, badges |
| `bg-indigo-600` | `bg-gradient-to-r from-pink-500 to-rose-500` | Przyciski primary |
| `bg-indigo-700` | `hover:shadow-md` | Hover na przyciskach |
| `text-indigo-600` | `text-pink-600` | Akcenty tekstowe |
| `text-indigo-700` | `text-pink-700` | Statusy, badges |
| `border-indigo-100` | `border-pink-100` | Obramowania kart |
| `border-indigo-200` | `border-pink-200` | Obramowania przycisków |
| `ring-indigo-500` | `ring-pink-500` | Focus rings na inputach |

**Zachowane kolory:**
- `emerald-*` - dla success states (urlopy zatwierdzone)
- `amber-*` - dla warning states (oczekujące)
- `red-*` - dla error/danger states (odrzucone, konflikty)
- `slate-*` - dla neutralnych elementów (tekst, tła)

---

## Testowanie po wdrożeniu

### Test 1: Routing
```bash
# Jako admin
1. Login → powinno przekierować na /app
2. Sprawdź navbar → wszystkie linki widoczne
3. Kliknij "Panel pracownika" → /self-service działa
4. Kliknij "Pracownicy" → /employees działa (tylko admin)

# Jako user
1. Login → powinno przekierować na /app
2. Sprawdź navbar → tylko Dashboard i Panel pracownika
3. Próba wejścia na /employees → przekierowanie na /app
```

### Test 2: Dashboard
```bash
# Jako user
1. Sprawdź licznik do następnej zmiany → aktualizuje się co sekundę
2. Wypełnij formularz dostępności → wyślij
3. Sprawdź listę zgłoszeń → status "pending"

# Jako admin
1. Sprawdź metryki → liczby się zgadzają
2. Sprawdź wszystkie zmiany → widoczne dla wszystkich pracowników
3. Dodaj powiadomienie → pojawia się na liście
```

### Test 3: Kolory
```bash
1. Wszystkie przyciski primary → pink/rose gradient
2. Aktywne linki w navbar → pink-100 tło
3. Focus na inputach → pink-500 ring
4. Badges statusów → odpowiednie kolory (emerald/amber/red)
```

---

## Gotowe pliki do skopiowania

Wszystkie pliki są w katalogu `/vercel/sandbox/`:

1. `frontend_src_App.jsx` → `frontend/src/App.jsx`
2. `frontend_src_pages_Dashboard.jsx` → `frontend/src/pages/Dashboard.jsx`
3. `frontend_src_components_Navbar.jsx` → `frontend/src/components/Navbar.jsx`
4. `frontend_src_pages_SelfService.jsx` → `frontend/src/pages/SelfService.jsx`
5. `backend_routes_employeeRoutes.js` → `backend/routes/employeeRoutes.js`

**Każdy plik jest gotowy do ctrl+c ctrl+v bez żadnych modyfikacji.**

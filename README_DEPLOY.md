# 🚀 KadryHR - Instrukcja wdrożenia

## ✅ Co zostało naprawione:

1. **Dashboard.jsx** - używa teraz endpoint `/employees/me` zamiast błędnej logiki
2. **Query dependencies** - dodano `currentEmployee._id` do queryKey
3. **Skrypty pomocnicze** - automatyczne powiązanie user → employee

## 📦 Pliki do wdrożenia:

```
M  frontend/src/App.jsx                    (routing poprawiony)
M  frontend/src/pages/Dashboard.jsx        (endpoint /me + queryKey)
M  frontend/src/components/Navbar.jsx      (kolory pink/rose)
M  frontend/src/pages/SelfService.jsx      (kolory pink/rose)
M  backend/routes/employeeRoutes.js        (endpoint /me)
A  backend/scripts/linkUserToEmployee.js   (nowy)
A  backend/scripts/verifySetup.js          (nowy)
```

## 🚀 Wdrożenie (3 kroki):

### Krok 1: Commit i push
```bash
git add .
git commit -m "fix: dashboard employee data fetching and query dependencies"
git push origin main
```

### Krok 2: Deploy na VPS
```bash
ssh deploy@vps-63e4449f
cd /home/deploy/apps/kadryhr-app
git pull origin main
./deploy.sh
```

### Krok 3: Powiąż użytkowników (WAŻNE!)
```bash
cd /home/deploy/apps/kadryhr-app/backend
node scripts/linkUserToEmployee.js
```

To powiąże test.pracownik@kadryhr.pl z pracownikiem testowym.

### Krok 4: Weryfikacja
```bash
node scripts/verifySetup.js
```

## 🧪 Test:

1. Otwórz https://kadryhr.pl/login
2. Zaloguj: test.pracownik@kadryhr.pl / Test1234!
3. Sprawdź Dashboard:
   - ✅ Licznik do następnej zmiany
   - ✅ Moje najbliższe zmiany
   - ✅ Formularz dostępności

## 🐛 Jeśli coś nie działa:

### "Brak przypisanego profilu pracownika"
```bash
node scripts/linkUserToEmployee.js
```

### Dashboard pusty
```bash
# Sprawdź logi
pm2 logs kadryhr-backend --lines 50

# Sprawdź czy endpoint działa
curl http://localhost:5000/api/employees/me -H "Cookie: jwt=TOKEN"
```

### Kolory nadal indigo
```
Ctrl+Shift+R (hard refresh)
```

## ✅ Gotowe!

Wszystkie zmiany są w repo i gotowe do wdrożenia.

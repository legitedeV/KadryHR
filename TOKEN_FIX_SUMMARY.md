# Naprawa błędu tokenu w Panelu Pracownika

## Problem
Panel pracownika (SelfService) wyświetlał ciągły błąd tokenu po zalogowaniu użytkownika `test@test.pl`.

## Przyczyna
Wykryto kilka problemów w przepływie autoryzacji:

1. **Brak szczegółowego logowania** - middleware autoryzacji nie logował szczegółów błędów
2. **Słaba obsługa błędów** - frontend nie wyświetlał konkretnych komunikatów o błędach tokenu
3. **Brak weryfikacji tokenu przy starcie** - aplikacja nie sprawdzała ważności tokenu przy załadowaniu
4. **Brak automatycznego wylogowania** - przy błędzie 401 użytkownik nie był automatycznie wylogowywany

## Wprowadzone zmiany

### 1. Backend - Middleware autoryzacji (`/backend/middleware/authMiddleware.js`)

**Dodano szczegółowe logowanie:**
- Logowanie źródła tokenu (cookie vs header)
- Podgląd tokenu (pierwsze 20 znaków)
- Szczegółowe logi błędów weryfikacji
- Rozróżnienie typów błędów JWT (wygasły token, nieprawidłowy token)

**Ulepszona obsługa błędów:**
```javascript
if (err.name === 'TokenExpiredError') {
  return res.status(401).json({ message: 'Token wygasł. Zaloguj się ponownie.' });
}
if (err.name === 'JsonWebTokenError') {
  return res.status(401).json({ message: 'Nieprawidłowy token. Zaloguj się ponownie.' });
}
```

### 2. Frontend - Axios Interceptor (`/frontend/src/api/axios.js`)

**Dodano szczegółowe logowanie:**
- Logowanie każdego żądania z tokenem
- Ostrzeżenia gdy brak tokenu w localStorage
- Szczegółowe logi błędów odpowiedzi

**Automatyczne wylogowanie przy błędzie 401:**
```javascript
if (error.response.status === 401) {
  console.error('[API] Token nieważny lub wygasł - czyszczenie sesji');
  localStorage.removeItem('kadryhr_token');
  localStorage.removeItem('kadryhr_user');
  
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}
```

### 3. Frontend - AuthContext (`/frontend/src/context/AuthContext.jsx`)

**Dodano weryfikację tokenu przy starcie:**
```javascript
useEffect(() => {
  const verifyToken = async () => {
    const token = localStorage.getItem('kadryhr_token');
    if (!token) return;

    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      localStorage.setItem('kadryhr_user', JSON.stringify(data));
    } catch (err) {
      // Wyczyść nieprawidłowy token
      localStorage.removeItem('kadryhr_token');
      localStorage.removeItem('kadryhr_user');
      setUser(null);
    }
  };
  verifyToken();
}, []);
```

**Dodano stan ładowania:**
- Aplikacja pokazuje spinner podczas weryfikacji tokenu
- Zapobiega migotaniu ekranu logowania

### 4. Frontend - App.jsx

**Dodano obsługę stanu ładowania w PrivateRoute i AdminRoute:**
- Wyświetlanie spinnera podczas weryfikacji tokenu
- Poprawione przekierowanie dla użytkowników nie-admin (dodano `super_admin`)

### 5. Frontend - SelfService.jsx (`/frontend/src/pages/SelfService.jsx`)

**Dodano szczegółową obsługę błędów:**
- Logowanie każdego zapytania API
- Wyświetlanie komunikatów o błędach autoryzacji
- Przycisk do ponownego logowania
- Wskaźniki ładowania dla każdego zapytania

**Dodano wizualne komunikaty błędów:**
```jsx
{hasAuthError && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <h3>Błąd autoryzacji</h3>
    <p>{authErrorMessage}</p>
    <button onClick={() => window.location.href = '/login'}>
      Przejdź do logowania
    </button>
  </div>
)}
```

## Jak zweryfikować naprawę

### 1. Sprawdź logi backendu
Po zalogowaniu powinieneś zobaczyć w logach backendu:
```
[AUTH] Token znaleziony: { source: 'header', path: '/employees/compact', tokenPreview: '...' }
[AUTH] Użytkownik zautoryzowany: { userId: '...', email: 'test@test.pl', role: 'user', path: '/employees/compact' }
```

### 2. Sprawdź logi przeglądarki (Console)
Po zalogowaniu powinieneś zobaczyć:
```
[AuthContext] Logowanie użytkownika: { id: '...', email: 'test@test.pl', ... }
[API] Dodano token do żądania: { method: 'GET', url: '/employees/compact', ... }
[API] Sukces: { status: 200, method: 'GET', url: '/employees/compact' }
```

### 3. Sprawdź Panel Pracownika
1. Zaloguj się jako `test@test.pl` / `Test123!`
2. Przejdź do `/self-service`
3. Sprawdź czy:
   - Nie ma czerwonego komunikatu o błędzie tokenu
   - Dane się ładują (lista pracowników, sugestie, prośby o zamianę)
   - Możesz dodawać sugestie i wnioski

### 4. Sprawdź automatyczne wylogowanie
1. Usuń token z localStorage w DevTools: `localStorage.removeItem('kadryhr_token')`
2. Odśwież stronę
3. Powinieneś zostać automatycznie przekierowany do `/login`

## Testowanie w produkcji

### Krok 1: Deploy zmian
```bash
cd /home/deploy/apps/kadryhr-app
git pull
./deploy.sh
```

### Krok 2: Sprawdź logi backendu
```bash
pm2 logs kadryhr-backend --lines 50
```

### Krok 3: Testuj w przeglądarce
1. Otwórz http://kadryhr.pl
2. Otwórz DevTools (F12) → zakładka Console
3. Zaloguj się jako `test@test.pl` / `Test123!`
4. Obserwuj logi w konsoli
5. Przejdź do Panelu Pracownika
6. Sprawdź czy wszystko działa

## Dodatkowe informacje

### Struktura tokenu JWT
Token zawiera:
```json
{
  "id": "user_id",
  "role": "user|admin|super_admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Przepływ autoryzacji
1. **Login** → Backend generuje JWT i wysyła w cookie + JSON response
2. **Frontend** → Zapisuje token w localStorage i user w localStorage
3. **Każde żądanie** → Frontend dodaje token do nagłówka `Authorization: Bearer <token>`
4. **Backend** → Sprawdza token w cookie LUB nagłówku Authorization
5. **Weryfikacja** → JWT.verify() sprawdza podpis i ważność
6. **Użytkownik** → Pobierany z bazy na podstawie `id` z tokenu

### Możliwe przyczyny błędów tokenu
1. **Token wygasł** - domyślnie 7 dni (JWT_EXPIRES_IN)
2. **Nieprawidłowy JWT_SECRET** - zmiana sekretu unieważnia wszystkie tokeny
3. **Użytkownik usunięty z bazy** - token ważny, ale użytkownik nie istnieje
4. **Błąd CORS** - token nie jest wysyłany z powodu CORS
5. **Brak tokenu** - localStorage został wyczyszczony

## Kontakt
W razie problemów sprawdź:
1. Logi backendu: `pm2 logs kadryhr-backend`
2. Logi przeglądarki: DevTools → Console
3. Network tab: DevTools → Network → sprawdź nagłówki żądań

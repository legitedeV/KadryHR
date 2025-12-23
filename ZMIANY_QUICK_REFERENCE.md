# Quick Reference - Zmiany w KadryHR

## 🎨 Zmienione Kolory Przycisków

### Przed:
```jsx
className="bg-indigo-600 hover:bg-indigo-700"
className="bg-slate-800 hover:bg-slate-900"
```

### Po:
```jsx
className="bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 hover:scale-105 transition-all duration-200"
```

---

## 📧 Konfiguracja Email (SMTP)

### Plik: `backend/.env`

```env
# SMTP Configuration (OVH)
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@kadryhr.pl
SMTP_PASS=twoje_haslo_tutaj
SMTP_FROM=KadryHR <noreply@kadryhr.pl>

# Frontend URL for invite links
FRONTEND_URL=http://kadryhr.pl
```

### Test wysyłki email:
```bash
cd backend
node test-mail.js
```

---

## 🎯 Nowe Klasy CSS

### Przyciski:
```jsx
<button className="btn-primary">Główny przycisk</button>
<button className="btn-secondary">Drugorzędny</button>
<button className="btn-danger">Usuń</button>
```

### Inputy:
```jsx
<input className="input-primary" />
<select className="select-primary" />
<textarea className="textarea-primary" />
```

### Karty:
```jsx
<div className="card-elevated">Karta z cieniem</div>
<div className="card-interactive">Interaktywna karta</div>
```

### Odznaki:
```jsx
<span className="badge-success">Sukces</span>
<span className="badge-warning">Ostrzeżenie</span>
<span className="badge-error">Błąd</span>
<span className="badge-info">Info</span>
<span className="badge-primary">Główny</span>
```

### Animacje:
```jsx
<div className="transition-smooth">Płynne przejście</div>
<div className="transition-fast">Szybkie przejście</div>
<div className="spinner">Ładowanie...</div>
```

---

## 🆕 Nowy Komponent Alert

### Import:
```jsx
import Alert from '../components/Alert';
```

### Użycie:
```jsx
<Alert 
  type="success" 
  title="Sukces!" 
  message="Operacja zakończona pomyślnie"
  onClose={() => console.log('Zamknięto')}
/>

<Alert 
  type="error" 
  title="Błąd" 
  message="Coś poszło nie tak"
/>

<Alert 
  type="warning" 
  title="Uwaga" 
  message="Sprawdź konfigurację"
/>

<Alert 
  type="info" 
  title="Informacja" 
  message="Nowa wersja dostępna"
/>
```

---

## 📂 Zmienione Pliki

### Frontend:
- ✅ `src/pages/Invites.jsx` - przyciski, alerty, status email
- ✅ `src/pages/Reports.jsx` - przyciski pobierania
- ✅ `src/pages/Register.jsx` - przyciski i inputy
- ✅ `src/index.css` - nowe klasy utility
- ✅ `src/components/Alert.jsx` - nowy komponent

### Backend:
- ✅ `utils/email.js` - ulepszona wysyłka email
- ✅ `routes/inviteRoutes.js` - status wysyłki email

---

## 🚀 Uruchomienie

### Frontend:
```bash
cd frontend
npm install
npm run dev      # Development
npm run build    # Production build
```

### Backend:
```bash
cd backend
npm install
npm run dev      # Development (nodemon)
npm start        # Production
```

---

## 🧪 Testowanie

### Build test:
```bash
cd frontend && npm run build
```

### Syntax check:
```bash
cd backend
node -c routes/inviteRoutes.js
node -c utils/email.js
```

---

## 📊 Status Zmian

| Obszar | Status | Opis |
|--------|--------|------|
| Kolory przycisków | ✅ | Ujednolicone do pink/rose |
| Email zaproszenia | ✅ | Naprawione + status |
| Inputy | ✅ | Spójny focus ring |
| Alerty | ✅ | Nowy komponent |
| CSS utilities | ✅ | Dodane klasy |
| Build | ✅ | Bez błędów |

---

## 💡 Szybkie Porady

### 1. Zmiana koloru głównego:
Edytuj `tailwind.config.js` i zmień `pink-500/rose-500` na inny kolor.

### 2. Dodanie nowego typu alertu:
Edytuj `src/components/Alert.jsx` i dodaj nowy typ w obiekcie `styles`.

### 3. Debugowanie email:
Sprawdź logi backendu - zawierają szczegółowe informacje o wysyłce.

### 4. Testowanie bez SMTP:
System działa bez SMTP - pokazuje link do skopiowania ręcznie.

---

## 🔗 Przydatne Linki

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Nodemailer Docs](https://nodemailer.com/)
- [Vite Docs](https://vitejs.dev/)

---

**Ostatnia aktualizacja:** 2025-12-23

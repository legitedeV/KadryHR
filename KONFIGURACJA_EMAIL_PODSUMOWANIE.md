# ✅ Podsumowanie konfiguracji wysyłania maili przez OVH

## 🎯 Co zostało zrobione

### 1. Backend - Konfiguracja SMTP

**Plik: `backend/.env.example`**
- ✅ Dodano zmienne środowiskowe dla SMTP OVH:
  ```env
  SMTP_HOST=ssl0.ovh.net
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=noreply@kadryhr.pl
  SMTP_PASS=your_email_password_here
  SMTP_FROM=KadryHR <noreply@kadryhr.pl>
  FRONTEND_URL=http://kadryhr.pl
  ```

**Plik: `backend/routes/inviteRoutes.js`**
- ✅ Zaimportowano funkcję `sendInviteEmail` z `utils/email.js`
- ✅ Zmodyfikowano endpoint `POST /api/invites` aby:
  - Generował pełny URL zaproszenia z tokenem
  - Wysyłał email z zaproszeniem do użytkownika
  - Zwracał link zaproszenia w odpowiedzi API
  - Logował sukces/błąd wysyłki

**Plik: `backend/test-mail.js`**
- ✅ Ulepszono skrypt testowy:
  - Wyświetla aktualną konfigurację SMTP
  - Waliduje obecność wymaganych zmiennych
  - Pokazuje szczegółowe komunikaty błędów
  - Podpowiada rozwiązania problemów

### 2. Frontend - Wyświetlanie linku zaproszenia

**Plik: `frontend/src/pages/Invites.jsx`**
- ✅ Zaktualizowano `createMutation.onSuccess` aby pobierał link z `response.data.link`
- ✅ Ulepszono UI wyświetlania linku:
  - Zielony panel z komunikatem sukcesu
  - Pole input z linkiem (read-only)
  - Przycisk "Kopiuj" do schowka
  - Alert po skopiowaniu

### 3. Dokumentacja

**Plik: `OVH_EMAIL_SETUP.md`**
- ✅ Kompletny przewodnik konfiguracji zawierający:
  - Instrukcje konfiguracji w panelu OVH
  - Ustawienia SMTP dla OVH
  - Konfigurację SPF i DKIM
  - Instrukcje konfiguracji backendu
  - Przewodnik testowania
  - Rozwiązywanie problemów
  - Checklist konfiguracji
  - Wskazówki dotyczące deploymentu

## 📋 Następne kroki - CO MUSISZ ZROBIĆ

### Krok 1: Utwórz konto email w panelu OVH

1. Zaloguj się do panelu OVH: https://www.ovh.com/manager/
2. Przejdź do **Web Cloud** → **E-maile**
3. Wybierz domenę `kadryhr.pl`
4. Utwórz konto email: `noreply@kadryhr.pl`
5. Ustaw silne hasło i **zapisz je bezpiecznie**

### Krok 2: Utwórz plik `.env` w backendzie

```bash
cd backend
cp .env.example .env
nano .env
```

Uzupełnij dane SMTP z panelu OVH:

```env
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@kadryhr.pl
SMTP_PASS=TUTAJ_WPISZ_HASLO_Z_OVH
SMTP_FROM=KadryHR <noreply@kadryhr.pl>
FRONTEND_URL=https://kadryhr.pl
```

### Krok 3: Przetestuj wysyłkę

```bash
cd backend

# Edytuj test-mail.js i zmień email testowy
nano test-mail.js
# Zmień: const TEST_EMAIL = 'twoj-email@gmail.com';

# Uruchom test
node test-mail.js
```

Sprawdź czy email dotarł (sprawdź też SPAM).

### Krok 4: Przetestuj przez aplikację

1. Uruchom backend: `cd backend && npm run dev`
2. Uruchom frontend: `cd frontend && npm run dev`
3. Zaloguj się jako admin
4. Przejdź do `/invites`
5. Utwórz zaproszenie
6. Sprawdź czy:
   - ✅ Pojawił się zielony panel z linkiem
   - ✅ Email dotarł na podany adres
   - ✅ Link w emailu działa

### Krok 5: Deploy na produkcję

```bash
# Na serwerze produkcyjnym
cd /path/to/kadryhr/backend
nano .env

# Uzupełnij produkcyjne dane:
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@kadryhr.pl
SMTP_PASS=produkcyjne_haslo
SMTP_FROM=KadryHR <noreply@kadryhr.pl>
FRONTEND_URL=https://kadryhr.pl
NODE_ENV=production

# Zrestartuj backend
pm2 restart kadryhr-backend
# lub
systemctl restart kadryhr-backend
```

## 🔍 Jak to działa

### Flow wysyłki zaproszenia:

```
1. Admin w panelu /invites
   ↓
2. Wypełnia formularz (email, rola)
   ↓
3. Klik "Utwórz zaproszenie"
   ↓
4. Frontend → POST /api/invites
   ↓
5. Backend:
   - Tworzy rekord Invite w MongoDB
   - Generuje token
   - Tworzy URL: https://kadryhr.pl/register?token=XXX&email=user@example.com
   - Wywołuje sendInviteEmail()
   ↓
6. Nodemailer → OVH SMTP (ssl0.ovh.net:587)
   ↓
7. OVH wysyła email do użytkownika
   ↓
8. Backend zwraca { invite, link }
   ↓
9. Frontend wyświetla zielony panel z linkiem
   ↓
10. Użytkownik otrzymuje email z linkiem
    ↓
11. Klik w link → /register?token=XXX
    ↓
12. Rejestracja w systemie
```

## 📊 Struktura zmian

```
backend/
├── .env.example          ← Dodano zmienne SMTP
├── routes/
│   └── inviteRoutes.js   ← Dodano wysyłkę email + generowanie linku
├── utils/
│   └── email.js          ← Istniejący moduł (bez zmian)
└── test-mail.js          ← Ulepszony skrypt testowy

frontend/
└── src/
    └── pages/
        └── Invites.jsx   ← Ulepszony UI z przyciskiem kopiowania

docs/
├── OVH_EMAIL_SETUP.md                    ← Pełna dokumentacja
└── KONFIGURACJA_EMAIL_PODSUMOWANIE.md    ← Ten plik
```

## ⚠️ Ważne uwagi

1. **Bezpieczeństwo**: 
   - Plik `.env` jest w `.gitignore` - NIE commituj go do repo
   - Hasło email przechowuj w bezpiecznym miejscu (password manager)

2. **Limity OVH**:
   - Sprawdź limity wysyłki w panelu OVH
   - Typowo: 200-500 maili/godzinę dla kont email

3. **SPF/DKIM** (opcjonalne, ale zalecane):
   - Zwiększa dostarczalność maili
   - Zmniejsza ryzyko trafienia do SPAM
   - Konfiguracja w panelu OVH → Domeny → Strefa DNS

4. **Monitoring**:
   - Sprawdzaj logi backendu: `pm2 logs kadryhr-backend`
   - Monitoruj wysłane maile w panelu OVH

## 🐛 Rozwiązywanie problemów

### "SMTP nie skonfigurowane"
→ Brak pliku `.env` lub brak zmiennych `SMTP_*`

### "Authentication failed"
→ Sprawdź hasło i czy `SMTP_USER` to pełny email

### "Connection timeout"
→ Sprawdź firewall, spróbuj portu 465 z `SMTP_SECURE=true`

### Maile w SPAM
→ Skonfiguruj SPF, DKIM, DMARC w strefie DNS

## 📞 Wsparcie

- Dokumentacja OVH: https://docs.ovh.com/pl/emails/
- Panel OVH: https://www.ovh.com/manager/
- Nodemailer docs: https://nodemailer.com/

## ✅ Checklist końcowy

- [ ] Konto email utworzone w panelu OVH
- [ ] Plik `.env` utworzony w `backend/` z danymi SMTP
- [ ] Test `node test-mail.js` zakończony sukcesem
- [ ] Test przez panel `/invites` zakończony sukcesem
- [ ] Email dotarł (nie w SPAM)
- [ ] Link zaproszenia działa
- [ ] Produkcja: `.env` zaktualizowany na serwerze
- [ ] Produkcja: backend zrestartowany
- [ ] Produkcja: test wysyłki zakończony sukcesem

---

**Status**: ✅ Implementacja zakończona  
**Data**: 2025-12-22  
**Wersja**: 1.0

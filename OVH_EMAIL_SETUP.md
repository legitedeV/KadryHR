# Konfiguracja wysyłania maili przez OVH w KadryHR

## 📧 Przegląd

Ten przewodnik opisuje jak skonfigurować wysyłanie maili w aplikacji KadryHR używając usługi email OVHcloud.

## 🔧 Konfiguracja w panelu OVH

### 1. Utwórz konto email w OVH

1. Zaloguj się do panelu OVH: https://www.ovh.com/manager/
2. Przejdź do sekcji **Web Cloud** → **E-maile**
3. Wybierz swoją domenę (np. `kadryhr.pl`)
4. Kliknij **Utwórz konto e-mail**
5. Utwórz konto, np.:
   - Email: `noreply@kadryhr.pl`
   - Hasło: (ustaw silne hasło i zapisz je bezpiecznie)

### 2. Sprawdź ustawienia SMTP

OVH używa następujących serwerów SMTP:

- **Host SMTP**: `ssl0.ovh.net`
- **Port SMTP**: 
  - `587` (STARTTLS - zalecane)
  - `465` (SSL/TLS)
- **Uwierzytelnianie**: Wymagane
- **Użytkownik**: Pełny adres email (np. `noreply@kadryhr.pl`)
- **Hasło**: Hasło do konta email

### 3. Weryfikacja SPF i DKIM (opcjonalne, ale zalecane)

Aby zwiększyć dostarczalność maili:

1. W panelu OVH przejdź do **Domeny** → Twoja domena → **Strefa DNS**
2. Sprawdź czy istnieje rekord SPF:
   ```
   v=spf1 include:mx.ovh.com ~all
   ```
3. Włącz DKIM w ustawieniach domeny (jeśli dostępne)

## ⚙️ Konfiguracja Backend

### 1. Utwórz plik `.env` w katalogu `backend/`

Skopiuj `.env.example` i uzupełnij danymi:

```bash
cd backend
cp .env.example .env
```

### 2. Edytuj plik `.env` i uzupełnij dane SMTP:

```env
# SMTP Configuration (OVH)
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@kadryhr.pl
SMTP_PASS=twoje_haslo_email
SMTP_FROM=KadryHR <noreply@kadryhr.pl>

# Frontend URL for invite links
FRONTEND_URL=https://kadryhr.pl
```

**Ważne:**
- `SMTP_SECURE=false` dla portu 587 (STARTTLS)
- `SMTP_SECURE=true` dla portu 465 (SSL/TLS)
- `SMTP_USER` musi być pełnym adresem email
- `FRONTEND_URL` powinien wskazywać na produkcyjny URL frontendu

### 3. Struktura plików email

Backend używa modułu `utils/email.js` z funkcją `sendInviteEmail()`:

```javascript
// backend/utils/email.js
const nodemailer = require('nodemailer');

// Automatycznie tworzy transporter z zmiennych środowiskowych
exports.sendInviteEmail = async ({ to, inviteUrl, invitedBy }) => {
  // Wysyła email z zaproszeniem
};
```

## 🧪 Testowanie wysyłki maili

### 1. Test z poziomu backendu

Użyj skryptu testowego:

```bash
cd backend

# Edytuj test-mail.js i zmień adres email na swój testowy
nano test-mail.js

# Uruchom test
node test-mail.js
```

### 2. Test przez API

1. Uruchom backend:
   ```bash
   cd backend
   npm run dev
   ```

2. Zaloguj się jako admin w aplikacji

3. Przejdź do sekcji **Zaproszenia** (`/invites`)

4. Utwórz nowe zaproszenie:
   - Podaj email
   - Wybierz rolę
   - Kliknij "Utwórz zaproszenie"

5. Sprawdź:
   - ✅ Czy pojawił się komunikat o sukcesie
   - ✅ Czy link zaproszenia został wygenerowany
   - ✅ Czy email dotarł na podany adres

## 🎯 Jak działa wysyłka zaproszeń

### Flow procesu:

1. **Admin tworzy zaproszenie** w panelu `/invites`
2. **Backend** (`routes/inviteRoutes.js`):
   - Tworzy rekord zaproszenia w bazie danych
   - Generuje unikalny token
   - Tworzy URL zaproszenia: `https://kadryhr.pl/register?token=XXX&email=user@example.com`
   - Wywołuje `sendInviteEmail()` z `utils/email.js`
3. **Email wysyłany** przez OVH SMTP zawiera:
   - Link do rejestracji z tokenem
   - Informacje o zapraszającym
   - Instrukcje dla użytkownika
4. **Użytkownik** klika link i rejestruje się w systemie

## 🔍 Rozwiązywanie problemów

### Problem: "SMTP nie skonfigurowane – pomijam wysyłkę maili"

**Rozwiązanie:**
- Sprawdź czy plik `.env` istnieje w katalogu `backend/`
- Upewnij się, że wszystkie zmienne `SMTP_*` są ustawione
- Zrestartuj backend: `npm run dev`

### Problem: "Authentication failed"

**Rozwiązanie:**
- Sprawdź czy `SMTP_USER` to pełny adres email (np. `noreply@kadryhr.pl`)
- Sprawdź czy hasło jest poprawne
- Upewnij się, że konto email jest aktywne w panelu OVH

### Problem: "Connection timeout"

**Rozwiązanie:**
- Sprawdź czy port 587 lub 465 nie jest zablokowany przez firewall
- Spróbuj zmienić port:
  - Port 587: `SMTP_SECURE=false`
  - Port 465: `SMTP_SECURE=true`

### Problem: Maile trafiają do SPAM

**Rozwiązanie:**
1. Skonfiguruj SPF w strefie DNS domeny
2. Włącz DKIM w panelu OVH
3. Dodaj rekord DMARC:
   ```
   _dmarc.kadryhr.pl TXT "v=DMARC1; p=none; rua=mailto:admin@kadryhr.pl"
   ```
4. Upewnij się, że `SMTP_FROM` używa domeny z poprawnym SPF

### Problem: "Error: self signed certificate"

**Rozwiązanie:**
- W `utils/email.js` jest już dodane:
  ```javascript
  tls: {
    rejectUnauthorized: false,
  }
  ```
- Jeśli problem nadal występuje, zaktualizuj Node.js do najnowszej wersji

## 📊 Monitoring i logi

### Logi backendu

Backend loguje wszystkie operacje email:

```bash
# Uruchom backend z logami
cd backend
npm run dev

# Obserwuj logi
# ✅ Sukces: "Wysłano mail z zaproszeniem do: user@example.com"
# ❌ Błąd: "Błąd wysyłki maila z zaproszeniem: [szczegóły]"
```

### Sprawdzanie w panelu OVH

1. Zaloguj się do panelu OVH
2. Przejdź do **E-maile** → Twoja domena
3. Kliknij na konto email (np. `noreply@kadryhr.pl`)
4. Sprawdź **Wysłane** aby zobaczyć historię wysłanych maili

## 🚀 Deployment na produkcję

### 1. Ustaw zmienne środowiskowe na serwerze

```bash
# Na serwerze produkcyjnym
cd /path/to/kadryhr/backend
nano .env
```

Uzupełnij produkcyjne dane:

```env
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@kadryhr.pl
SMTP_PASS=produkcyjne_haslo
SMTP_FROM=KadryHR <noreply@kadryhr.pl>
FRONTEND_URL=https://kadryhr.pl
NODE_ENV=production
```

### 2. Zrestartuj backend

```bash
pm2 restart kadryhr-backend
# lub
systemctl restart kadryhr-backend
```

### 3. Przetestuj wysyłkę

Utwórz testowe zaproszenie przez panel admina i sprawdź logi:

```bash
pm2 logs kadryhr-backend
```

## 📝 Checklist konfiguracji

- [ ] Utworzone konto email w panelu OVH (np. `noreply@kadryhr.pl`)
- [ ] Plik `.env` utworzony w `backend/` z danymi SMTP
- [ ] Zmienne `SMTP_*` poprawnie ustawione
- [ ] `FRONTEND_URL` wskazuje na produkcyjny URL
- [ ] Test wysyłki przez `test-mail.js` zakończony sukcesem
- [ ] Test wysyłki przez panel `/invites` zakończony sukcesem
- [ ] Email dotarł na skrzynkę odbiorczą (nie SPAM)
- [ ] SPF skonfigurowane w strefie DNS (opcjonalne)
- [ ] DKIM włączone w panelu OVH (opcjonalne)
- [ ] Backend na produkcji zrestartowany z nowymi zmiennymi

## 🔗 Przydatne linki

- [Panel OVH](https://www.ovh.com/manager/)
- [Dokumentacja OVH Email](https://docs.ovh.com/pl/emails/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [SPF Record Checker](https://mxtoolbox.com/spf.aspx)
- [DKIM Checker](https://mxtoolbox.com/dkim.aspx)

## 💡 Wskazówki

1. **Bezpieczeństwo**: Nigdy nie commituj pliku `.env` do repozytorium
2. **Limity**: OVH ma limity wysyłki (sprawdź w panelu)
3. **Monitoring**: Regularnie sprawdzaj logi wysyłki
4. **Backup**: Zapisz hasło email w bezpiecznym miejscu (np. password manager)
5. **Testing**: Zawsze testuj na środowisku deweloperskim przed produkcją

---

**Autor**: KadryHR Team  
**Data**: 2025-12-22  
**Wersja**: 1.0

# Zaproszenia pracowników

## Jak to działa
- Podczas tworzenia pracownika z adresem e-mail w panelu generujemy rekord `EmployeeInvitation` z jednorazowym tokenem (hash w bazie) ważnym 24h.
- Token jest osadzany w linku `https://kadryhr.pl/auth/accept-invitation?token=...` i wysyłany przez kolejkę e-mail do wskazanego adresu.
- Akceptacja zaproszenia ustawia hasło użytkownika, łączy rekord `User` z `Employee`, uzupełnia telefon (jeśli podany) i loguje do panelu.
- Akcje są audytowane (`EMPLOYEE_CREATE`, `EMPLOYEE_INVITATION_RESEND`, `employee.invitation.accepted`).

## Endpointy
- `POST /auth/invitations/validate` – body `{ token }`; zwraca nazwę organizacji, e-mail zaproszonego, imię i nazwisko oraz datę wygaśnięcia. Zwraca 400 gdy token nieważny.
- `POST /auth/invitations/accept` – body `{ token, password, phone?, acceptTerms? }`; ustawia hasło i loguje użytkownika.
- `POST /employees/:id/resend-invitation` – dostępne dla OWNER/MANAGER; unieważnia poprzednie PENDING zaproszenia i wysyła nowe (ograniczenie: jedno na 10 minut).

## TTL i bezpieczeństwo
- Token ważny 24h (`expiresAt`), pojedynczego użycia (`status` zmienia się na `ACCEPTED` lub `REVOKED`).
- Próba ponownej wysyłki częściej niż co 10 minut zwraca 400.
- Tokeny w bazie są hashowane SHA-256; w e-mailu wysyłamy tylko surowy token.

## Jak przetestować lokalnie
1. `cd backend-v2 && npm run start:dev` (wymaga lokalnego Postgresa lub skonfigurowanego `DATABASE_URL`).
2. `cd frontend-v2 && npm run dev` i otwórz `http://localhost:3000/panel/pracownicy`.
3. Dodaj pracownika z e-mailem – w odpowiedzi API otrzymasz `invitationSent=true` (błąd kolejki pokaże `invitationError`).
4. W logach backendu znajdź adres zaproszenia lub w testach mockuj adapter e-mail.
5. Odwiedź `/auth/accept-invitation?token=...`, ustaw hasło i sprawdź przekierowanie do panelu.

## Ponawianie zaproszeń
- W tabeli pracowników kliknij „Wyślij ponownie” w wierszu pracownika z e-mailem.
- W przypadku błędu pokaże się toast; wysyłka ma limit częstotliwości jak wyżej.

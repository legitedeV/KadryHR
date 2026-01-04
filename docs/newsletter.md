# Newsletter KadryHR

## Przepływ subskrypcji
1. Użytkownik wypełnia formularz na landing page (`/#newsletter`) podając e-mail, opcjonalne imię i zgodę marketingową.
2. Backend (`POST /api/public/newsletter/subscribe`) tworzy/aktualizuje rekord `NewsletterSubscriber` ze statusem `PENDING_CONFIRMATION` i generuje token potwierdzenia w tabeli `NewsletterToken` (ważny 24h).
3. Wysyłany jest e-mail potwierdzający z linkiem `https://kadryhr.pl/newsletter/confirm?token=...` za pośrednictwem kolejki BullMQ i `EmailAdapter`.
4. Po kliknięciu w link (`POST/GET /api/public/newsletter/confirm`) token jest weryfikowany, subskrybent otrzymuje status `ACTIVE`, a system generuje token wypisu.
5. Od razu wysyłany jest powitalny newsletter z HTML-templatką oraz linkiem wypisu `https://kadryhr.pl/newsletter/unsubscribe?token=...`.
6. Wypis (`POST/GET /api/public/newsletter/unsubscribe`) ustawia status `UNSUBSCRIBED` oraz datę wypisu.

## Unsubscribe
Każdy newsletter zawiera link z tokenem typu `newsletter_unsubscribe`. Jego użycie ustawia `usedAt`, `unsubscribedAt` i status `UNSUBSCRIBED`. Wypis można odwrócić ponowną subskrypcją (nowy token potwierdzający).

## HTML template
Szablon powitalnego newslettera znajduje się w `backend-v2/src/newsletter/templates/welcome-newsletter-template.ts`. Zawiera hero z logotypem KadryHR, sekcję "Co nowego", CTA do panelu oraz stopkę z informacją prawną i linkiem wypisu. Templatka jest responsywna i używa podstawowych stylów inline.

## Jak testować lokalnie
- Backend: uruchom `cd backend-v2 && npm run start:dev` z ustawionym Redis i SMTP (lub EMAIL_ENABLED=false dla trybu skip). Uderzaj w `POST http://localhost:4000/api/public/newsletter/subscribe` z JSON `{ "email": "test@example.com", "marketingConsent": true }`.
- Potwierdzenie i wypis można zasymulować przez tokeny z bazy (`NewsletterToken`), dołączając je do endpointów `confirm`/`unsubscribe`.
- Frontend: `cd frontend-v2 && npm run dev`, następnie w przeglądarce przejdź na `/` i przetestuj formularz newslettera. Strony potwierdzenia/wypisu dostępne pod `/newsletter/confirm?token=...` i `/newsletter/unsubscribe?token=...`.

## Gdzie w kodzie
- Modele Prisma: `backend-v2/prisma/schema.prisma`
- Logika: `backend-v2/src/newsletter/newsletter.service.ts`, kontrolery `newsletter.controller.ts`
- Kolejka: `backend-v2/src/queue/newsletter-email.processor.ts` + `QueueService.addNewsletterEmailJob`
- Frontend landing: `frontend-v2/app/page.tsx` + `components/NewsletterSignup.tsx`
- Frontend UX potwierdzenia/wypisu: `frontend-v2/app/newsletter/confirm/page.tsx`, `frontend-v2/app/newsletter/unsubscribe/page.tsx`
- Widok ownera: `frontend-v2/app/panel/newsletter-subscribers/page.tsx`

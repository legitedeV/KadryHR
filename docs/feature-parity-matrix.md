# Feature Parity Matrix — KadryHR (source of truth)

Legend:
- **CURRENT** – istnieje w repo i jest używane.
- **GAP** – brak lub istotne braki pokrycia (brakuje kluczowego modelu/endpointu/ekranu, flow zablokowane).
- **IN_PROGRESS** – rozwijane w bieżącym sprincie.
- **DONE** – spełnia akceptację i ma testy/regresję.
- **STUB** – podstawowa implementacja placeholder, gotowa do rozbudowy.
Statusy odnoszą się do rzeczywistego kodu (backend-v2 + frontend-v2). Dokument prowadzony w PL; nazwy techniczne (statusy, endpointy, widget) pozostają w EN dla jednoznaczności.

Proces: każda istotna zmiana funkcjonalna powinna być połączona z GitHub Issue, uzupełnić `docs/CHANGELOG.md` i respektować Prompt Contract V2 (E2E, testy, docs, audit, RBAC, orgId).

## Macierz funkcjonalna (backend + frontend)
| Feature area | Status | Backend coverage (Prisma + endpoints) | Frontend coverage (routes) | Acceptance criteria / gap notes |
| --- | --- | --- | --- | --- |
| Landing / Marketing site | DONE | N/A (static marketing) | `/`, `/cennik`, `/o-nas`, `/kontakt` styled with Tailwind/global CSS | Landing renders with KadryHR layout in `npm run dev` and `npm run build && npm start`; deploy behind nginx per `docs/deploy-frontend-nginx.md`. |
| Auth & role access | CURRENT | Models: `User`, `Organisation`, enum `Role`. Endpoints: `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout`, `GET/POST/PATCH /users` (RBAC). | `/login`, `/panel` guard, `/panel/profil` (refresh/logout). | User can log in, refresh token, and access panel; roles enforced server-side for user mutations. **Obserwowane**: `/register` owner flow zgłasza HTTP 500 przy tworzeniu konta z e-mailem produkcyjnym – wymaga weryfikacji i testów. |
| Organisations & tenancy | CURRENT | Models: `Organisation`. Endpoints: `GET /organisations/me`, `PATCH /organisations/me`. All other controllers scope by `organisationId`. | Org name shown in dashboards; no dedicated org edit UI (gap noted). | Tenant scoping active on queries; owner/manager can update org metadata. |
| Employees & locations | CURRENT | Models: `Employee`, `Location`, `LocationAssignment`. Endpoints: `GET/POST/PATCH/DELETE /employees`, `GET /employees/:id`, `GET/POST/PATCH/DELETE /locations`, `PATCH /locations/:id/employees`. | `/panel/pracownicy` (CRUD + zaproszenia ponowne), `/panel/lokalizacje` (CRUD + employee assignment). | Creating/updating/deleting employees and locations persists via API and reflects in lists; zaproszenie można ponowić z listy. |
| Scheduling (shifts + availability) | DONE | Models: `Shift`, `Availability`. Endpoints: `GET /shifts`, `GET /shifts/summary`, `POST /shifts`, `PATCH/DELETE /shifts/:id`; `POST /shifts/publish-schedule`; `GET/POST/PATCH/DELETE /availability`. | `/panel/grafik` (week grid + CRUD + publish notifications), `/panel/dashboard` widgets. | Shifts można dodawać/edytować/usuwać z potwierdzeniem, przypisywać pracowników i lokalizacje, publikować tydzień do pracowników; availability zwracana per employee. Gaps: brak szablonów/kopiowania tygodni (backlog). |
| Leave requests | IN_PROGRESS | Models: `LeaveRequest`, `LeaveType` (org scoped) + enums `LeaveCategory`, `LeaveStatus`. Endpoints: CRUD for leave types `/leave-types`, leave requests with leaveTypeId and status transitions/audit. Shift validator blocks overlaps when policy enabled. | `/panel/wnioski` list/create/approve with status changes, leave type management, markers in grafik for approved leave. | Employee submit/cancel PENDING, manager approves/rejects, audit + notifications. Gap: balances/attachments storage and extended filters. |
| Time & Attendance (RCP/clock events) | GAP | Brak modeli czasu pracy/zdarzeń, brak kontrolera (tylko grafiki/wnioski). | Brak UI do rejestracji wejść/wyjść. | DONE gdy istnieją modele zdarzeń, endpointy start/stop/przerwa z regułami geofence/urządzenie, log audytowy oraz UI widget do odbijania. |
| Notifications | DONE | Models: `Notification`, `NotificationPreference`, `NotificationDeliveryAttempt`, `NotificationCampaign`, `NotificationRecipient` + enums. Endpoints: `GET /notifications`, `POST /notifications/:id/read`, `PATCH /notifications/mark-all-read`, `GET /notifications/unread-count`, `GET/PUT /notifications/preferences`, `POST /notifications/campaigns`, `POST /notifications/campaigns/:id/send`, `GET /notifications/campaigns`, `GET /notifications/campaigns/:id`. System triggers: shift assignment, schedule publish, leave status. Queue: BullMQ for email delivery with retries. | `/panel/powiadomienia` (inbox + preferences tabs), `/panel/powiadomienia/wyslij` (campaign composer with role/location/employee targeting), `/panel/powiadomienia/historia` (campaign list with filters), `/panel/powiadomienia/historia/[id]` (campaign details with delivery stats). | **Tests**: 15+ unit tests (audience resolution, preference filtering), 3 E2E tests (campaign flow, RBAC, multi-tenancy). **How to test**: `npm test -- notifications && npm run test:e2e`. **Manual**: Manager creates campaign with audience filters → sends → employee sees in inbox → marks read → unread count updates. System triggers tested via shift/leave operations. See `docs/notifications-v2-testing.md` for full scenarios. |
| Marketing newsletter / emails | IN_PROGRESS | Models: `NewsletterSubscriber`, `NewsletterToken`, enum `NewsletterSubscriptionStatus`. Endpoints: `POST /public/newsletter/subscribe`, `POST/GET /public/newsletter/confirm`, `POST/GET /public/newsletter/unsubscribe`, `GET /newsletter/subscribers` (OWNER). Queue: dedicated BullMQ worker for confirmation + welcome emails, templated HTML newsletter. | Landing signup section (`/#newsletter`), confirmation + unsubscribe pages (`/newsletter/confirm`, `/newsletter/unsubscribe`), admin widok właściciela `/panel/newsletter-subscribers` (read-only lista + filtry). | **Flow**: użytkownik zapisuje się na landing, otrzymuje mail z linkiem potwierdzającym, po kliknięciu dostaje powitalny newsletter z linkiem wypisu. OWNER widzi listę subskrybentów z datami potwierdzeń/wypisów. Brak kampanii seryjnych (backlog). **Obserwowane**: HTTP 500 przy subscribe/confirm w środowisku produkcyjnym – wymagane dalsze utwardzenie i testy. |
| Employee onboarding & invitations | DONE | Models: `EmployeeInvitation` + enum `InvitationStatus`; endpoints: `POST /employees` issuing single-use token, `POST /employees/:id/resend-invitation`, `POST /auth/invitations/validate`, `POST /auth/invitations/accept`. Queue sends HTML onboarding email with CTA. Audit: creation/resend + acceptance logged. | `/panel/pracownicy` surface info after tworzeniu oraz przycisk "Wyślij ponownie" wiersza; publiczny `/auth/accept-invitation` z formularzem ustawienia hasła/telefonu i zgody na regulamin. | Zaproszenie generuje się przy tworzeniu pracownika z e-mailem, można je ponowić (limit 10 min). Odbiorca otwiera link, widzi dane organizacji, ustawia hasło i jest logowany do `/panel/dashboard`. Re-send obsługuje walidację aktywnego konta (4xx), audyt i kolejkę email. **Obserwowane**: HTTP 500 podczas ponownego wysyłania w środowisku produkcyjnym – do naprawy. |
| Team management | CURRENT | Models: `User`, `Organisation`. Endpoints: `GET /organisations/me/members`, `PATCH /users/:id/role`, `DELETE /users/:id`, user CRUD endpoints. | `/panel/zespol` (member list, role management, invite users, search/filter by role). | OWNER/ADMIN can view all org members, change roles (OWNER only), invite new users, and remove users. Supports search and role filtering. |
| Reports & Exports | STUB | Models: N/A. Endpoints: `GET /reports/schedule`, `GET /reports/leaves` with format=csv parameter. | `/panel/raporty` (schedule and leaves reports with CSV export). | Basic CSV export for schedule and leave requests available. Date range selection supported. Gap: Advanced filtering, PDF export, custom report builder. |
| Billing & Subscriptions | STUB | Models: `Subscription`. Endpoints: `GET /subscriptions/me`. | `/panel/rozliczenia` (current plan display, upgrade options placeholder). | Subscription model exists with plan and status fields. Basic UI shows current plan. Payment integration and plan changes deferred to backlog. |
| Two-factor authentication (2FA) | STUB | Models: `User` with `twoFactorEnabled`, `twoFactorSecret` fields. | `/panel/profil` (2FA section with "Coming soon" label). | Database fields ready for 2FA implementation. UI placeholder informs users feature is in development. Full TOTP implementation deferred to backlog. |
| Payroll / external integrations | GAP | Brak warstwy integracji/export profiles. | Brak UI do konfiguracji integracji. | DONE gdy profil eksportu płac działa i zapisuje audyt. |
| Employee mobile / PWA | GAP | API w pełni web; brak offline/push. | Panel responsywny, ale brak manifestu/service worker i widgetu RCP. | DONE gdy panel jest instalowalny (PWA), działa offline retry i ma mobilny clock/schedule/leave flow. |

Kryteria w kolumnie "Acceptance criteria / gap notes" traktuj jako scenariusze testowe (manual/e2e) do potwierdzenia przy zmianie statusu na **DONE**.

### How to test (landing)
- Uruchom lokalnie: `cd frontend-v2 && npm run dev` lub `npm run build && npm start` – strona `/` ma być w pełni ostylowana (Tailwind, global CSS).
- Instrukcja deploy + snippet nginx: zob. [`docs/deploy-frontend-nginx.md`](./deploy-frontend-nginx.md).

## Backend endpoint inventory (obecne)
- **auth**: `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout`
- **users**: `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`, `PATCH /users/:id/role`
- **organisations**: `GET /organisations/me`, `PATCH /organisations/me`, `GET /organisations/me/members`
- **employees**: `GET /employees`, `GET /employees/:id`, `POST /employees`, `PATCH /employees/:id`, `DELETE /employees/:id`
- **locations**: `GET /locations`, `GET /locations/:id`, `POST /locations`, `PATCH /locations/:id`, `PATCH /locations/:id/employees`, `DELETE /locations/:id`
- **shifts**: `GET /shifts`, `GET /shifts/summary`, `POST /shifts`, `PATCH /shifts/:id`, `DELETE /shifts/:id`, `POST /shifts/publish-schedule`
- **availability**: `GET /availability`, `POST /availability`, `PATCH /availability/:id`, `DELETE /availability/:id`
- **leave-requests**: `GET /leave-requests`, `GET /leave-requests/:id`, `POST /leave-requests`, `PATCH /leave-requests/:id`, `PATCH /leave-requests/:id/status`
- **notifications**: `GET /notifications`, `POST /notifications/:id/read`, `PATCH /notifications/mark-all-read`, `GET /notifications/unread-count`, `GET /notifications/preferences`, `PUT /notifications/preferences`, `POST /notifications/campaigns`, `POST /notifications/campaigns/:id/send`, `GET /notifications/campaigns`, `GET /notifications/campaigns/:id`
- **newsletter**: `POST /public/newsletter/subscribe`, `POST/GET /public/newsletter/confirm`, `POST/GET /public/newsletter/unsubscribe`, `GET /newsletter/subscribers`
- **reports**: `GET /reports/schedule`, `GET /reports/leaves` (with format=csv parameter)
- **subscriptions**: `GET /subscriptions/me`

## Prisma model inventory
Enums: `Role`, `Weekday`, `LeaveType`, `LeaveStatus`, `NotificationType`, `NotificationChannel`, `NotificationDeliveryStatus`, `NotificationCampaignStatus`, `NotificationRecipientStatus`, `NewsletterSubscriptionStatus`.
Models: `Organisation`, `User` (with 2FA fields), `Employee`, `Location`, `LocationAssignment`, `Shift`, `Availability`, `LeaveRequest`, `AuditLog`, `Notification`, `NotificationPreference`, `NotificationDeliveryAttempt`, `NotificationCampaign`, `NotificationRecipient`, `NewsletterSubscriber`, `NewsletterToken`, `Subscription`.

## Frontend route inventory (Next.js app router)
- Public marketing: `/` (home), `/cennik`, `/o-nas`, `/kontakt`, `/newsletter/confirm`, `/newsletter/unsubscribe`.
- Auth: `/login`.
- Panel shell: `/panel` (redirect to dashboard), `/panel/dashboard`.
- HR modules: `/panel/pracownicy`, `/panel/lokalizacje`, `/panel/grafik`, `/panel/wnioski`, `/panel/profil`, `/panel/newsletter-subscribers`, `/panel/zespol`, `/panel/raporty`, `/panel/rozliczenia`.
- Notifications: `/panel/powiadomienia` (inbox + preferences), `/panel/powiadomienia/wyslij` (campaign composer), `/panel/powiadomienia/historia` (campaign list), `/panel/powiadomienia/historia/[id]` (campaign details).
- Admin: `/panel/admin`, `/panel/admin/organisations`, `/panel/admin/users`.
- Audit: `/panel/audit`.

## Zasady utrzymania macierzy
1. Aktualizuj status w tabeli po każdej zmianie modeli Prisma, endpointów lub routów UI — **CURRENT** gdy funkcja jest dostępna w produkcyjnym flow (może mieć opisane braki). **DONE** po spełnieniu kryteriów akceptacji i zarejestrowanej regresji/testów.
2. Po dodaniu/zmianie kontrolera lub strony dopisz go w odpowiedniej sekcji inventory (backend/frontend) i dopisz model, jeśli został dodany w `prisma/schema.prisma`.
3. W PR dodaj krótką notkę z jakich plików pochodzi zmiana (kontroler/route/model) i upewnij się, że tabela akceptacji odzwierciedla aktualny stan.
4. Przy oznaczeniu **DONE** dodaj link do testu automatycznego (np. `backend-v2/src/...spec.ts`) lub odnotuj manualny case w kolumnie Acceptance, aby regresja była odnajdywalna.

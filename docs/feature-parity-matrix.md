# Feature Parity Matrix — KadryHR (source of truth)

Legend:
- **CURRENT** – istnieje w repo i jest używane.
- **GAP** – brak lub istotne braki pokrycia (brakuje kluczowego modelu/endpointu/ekranu, flow zablokowane).
- **IN_PROGRESS** – rozwijane w bieżącym sprincie.
- **DONE** – spełnia akceptację i ma testy/regresję.
Statusy odnoszą się do rzeczywistego kodu (backend-v2 + frontend-v2). Dokument prowadzony w PL; nazwy techniczne (statusy, endpointy, widget) pozostają w EN dla jednoznaczności.

## Macierz funkcjonalna (backend + frontend)
| Feature area | Status | Backend coverage (Prisma + endpoints) | Frontend coverage (routes) | Acceptance criteria / gap notes |
| --- | --- | --- | --- | --- |
| Auth & role access | CURRENT | Models: `User`, `Organisation`, enum `Role`. Endpoints: `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout`, `GET/POST/PATCH /users` (RBAC). | `/login`, `/panel` guard, `/panel/profil` (refresh/logout). | User can log in, refresh token, and access panel; roles enforced server-side for user mutations. |
| Organisations & tenancy | CURRENT | Models: `Organisation`. Endpoints: `GET /organisations/me`, `PATCH /organisations/me`. All other controllers scope by `organisationId`. | Org name shown in dashboards; no dedicated org edit UI (gap noted). | Tenant scoping active on queries; owner/manager can update org metadata. |
| Employees & locations | CURRENT | Models: `Employee`, `Location`, `LocationAssignment`. Endpoints: `GET/POST/PATCH/DELETE /employees`, `GET /employees/:id`, `GET/POST/PATCH/DELETE /locations`, `PATCH /locations/:id/employees`. | `/panel/pracownicy` (CRUD + search/sort/pagination), `/panel/lokalizacje` (CRUD + employee assignment). | Creating/updating/deleting employees and locations persists via API and reflects in lists. |
| Scheduling (shifts + availability) | CURRENT (basic) | Models: `Shift`, `Availability`. Endpoints: `GET /shifts`, `GET /shifts/summary`, `POST /shifts`, `PATCH/DELETE /shifts/:id`; `GET/POST/PATCH/DELETE /availability`. | `/panel/grafik` (week grid uses `/shifts` + summary), `/panel/dashboard` widgets. | Shifts read/write succeed and summary returns hours; availability returned per employee. Gaps: no templates/recurrence/conflict engine. |
| Leave requests | CURRENT (basic) | Model: `LeaveRequest` + enums `LeaveType`, `LeaveStatus`. Endpoints: `GET /leave-requests`, `GET /leave-requests/:id`, `POST /leave-requests`, `PATCH /leave-requests/:id`, `PATCH /leave-requests/:id/status`. | `/panel/wnioski` list/create/approve with status changes; role guard for approvals. | Employee can submit request, manager can approve/reject, status updates visible. Gap: no balances/attachments storage. |
| Time & Attendance (RCP/clock events) | GAP | Brak modeli czasu pracy/zdarzeń, brak kontrolera (tylko grafiki/wnioski). | Brak UI do rejestracji wejść/wyjść. | DONE gdy istnieją modele zdarzeń, endpointy start/stop/przerwa z regułami geofence/urządzenie, log audytowy oraz UI widget do odbijania. |
| Notifications | DONE | Models: `Notification`, `NotificationPreference`, `NotificationDeliveryAttempt`, `NotificationCampaign`, `NotificationRecipient` + enums. Endpoints: `GET /notifications`, `POST /notifications/:id/read`, `PATCH /notifications/mark-all-read`, `GET /notifications/unread-count`, `GET/PUT /notifications/preferences`, `POST /notifications/campaigns`, `POST /notifications/campaigns/:id/send`, `GET /notifications/campaigns`, `GET /notifications/campaigns/:id`. System triggers: shift assignment, schedule publish, leave status. Queue: BullMQ for email delivery with retries. | `/panel/powiadomienia` (inbox + preferences tabs), `/panel/powiadomienia/wyslij` (campaign composer with role/location/employee targeting), `/panel/powiadomienia/historia` (campaign list with filters), `/panel/powiadomienia/historia/[id]` (campaign details with delivery stats). | **Tests**: 15+ unit tests (audience resolution, preference filtering), 3 E2E tests (campaign flow, RBAC, multi-tenancy). **How to test**: `npm test -- notifications && npm run test:e2e`. **Manual**: Manager creates campaign with audience filters → sends → employee sees in inbox → marks read → unread count updates. System triggers tested via shift/leave operations. See `docs/notifications-v2-testing.md` for full scenarios. |
| Reports & Exports | GAP | Brak agregujących endpointów/formatterów CSV/XLS. | Brak widoków raportów/eksportów. | DONE gdy dostępne raporty (grafik/absencje) z eksportem CSV/XLS zgodnym z filtrem. |
| Payroll / external integrations | GAP | Brak warstwy integracji/export profiles. | Brak UI do konfiguracji integracji. | DONE gdy profil eksportu płac działa i zapisuje audyt. |
| Employee mobile / PWA | GAP | API w pełni web; brak offline/push. | Panel responsywny, ale brak manifestu/service worker i widgetu RCP. | DONE gdy panel jest instalowalny (PWA), działa offline retry i ma mobilny clock/schedule/leave flow. |

Kryteria w kolumnie "Acceptance criteria / gap notes" traktuj jako scenariusze testowe (manual/e2e) do potwierdzenia przy zmianie statusu na **DONE**.

## Backend endpoint inventory (obecne)
- **auth**: `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `POST /auth/logout`
- **users**: `GET /users`, `POST /users`, `PATCH /users/:id`
- **organisations**: `GET /organisations/me`, `PATCH /organisations/me`
- **employees**: `GET /employees`, `GET /employees/:id`, `POST /employees`, `PATCH /employees/:id`, `DELETE /employees/:id`
- **locations**: `GET /locations`, `GET /locations/:id`, `POST /locations`, `PATCH /locations/:id`, `PATCH /locations/:id/employees`, `DELETE /locations/:id`
- **shifts**: `GET /shifts`, `GET /shifts/summary`, `POST /shifts`, `PATCH /shifts/:id`, `DELETE /shifts/:id`, `POST /shifts/publish-schedule`
- **availability**: `GET /availability`, `POST /availability`, `PATCH /availability/:id`, `DELETE /availability/:id`
- **leave-requests**: `GET /leave-requests`, `GET /leave-requests/:id`, `POST /leave-requests`, `PATCH /leave-requests/:id`, `PATCH /leave-requests/:id/status`
- **notifications**: `GET /notifications`, `POST /notifications/:id/read`, `PATCH /notifications/mark-all-read`, `GET /notifications/unread-count`, `GET /notifications/preferences`, `PUT /notifications/preferences`, `POST /notifications/campaigns`, `POST /notifications/campaigns/:id/send`, `GET /notifications/campaigns`, `GET /notifications/campaigns/:id`

## Prisma model inventory
Enums: `Role`, `Weekday`, `LeaveType`, `LeaveStatus`, `NotificationType`, `NotificationChannel`, `NotificationDeliveryStatus`, `NotificationCampaignStatus`, `NotificationRecipientStatus`.  
Models: `Organisation`, `User`, `Employee`, `Location`, `LocationAssignment`, `Shift`, `Availability`, `LeaveRequest`, `AuditLog`, `Notification`, `NotificationPreference`, `NotificationDeliveryAttempt`, `NotificationCampaign`, `NotificationRecipient`.

## Frontend route inventory (Next.js app router)
- Public marketing: `/` (home), `/cennik`, `/o-nas`, `/kontakt`.
- Auth: `/login`.
- Panel shell: `/panel` (redirect to dashboard), `/panel/dashboard`.
- HR modules: `/panel/pracownicy`, `/panel/lokalizacje`, `/panel/grafik`, `/panel/wnioski`, `/panel/profil`.
- Notifications: `/panel/powiadomienia` (inbox + preferences), `/panel/powiadomienia/wyslij` (campaign composer), `/panel/powiadomienia/historia` (campaign list), `/panel/powiadomienia/historia/[id]` (campaign details).

## Zasady utrzymania macierzy
1. Aktualizuj status w tabeli po każdej zmianie modeli Prisma, endpointów lub routów UI — **CURRENT** gdy funkcja jest dostępna w produkcyjnym flow (może mieć opisane braki). **DONE** po spełnieniu kryteriów akceptacji i zarejestrowanej regresji/testów.
2. Po dodaniu/zmianie kontrolera lub strony dopisz go w odpowiedniej sekcji inventory (backend/frontend) i dopisz model, jeśli został dodany w `prisma/schema.prisma`.
3. W PR dodaj krótką notkę z jakich plików pochodzi zmiana (kontroler/route/model) i upewnij się, że tabela akceptacji odzwierciedla aktualny stan.
4. Przy oznaczeniu **DONE** dodaj link do testu automatycznego (np. `backend-v2/src/...spec.ts`) lub odnotuj manualny case w kolumnie Acceptance, aby regresja była odnajdywalna.

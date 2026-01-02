# Repository audit – backend-v2 & frontend-v2

## Backend-v2 modules/routes
- **Auth**: JWT access/refresh, roles (OWNER/MANAGER/EMPLOYEE); controller at `src/auth/auth.controller.ts`.
- **Organisations**: CRUD under `src/organisations` for tenants.
- **Users**: CRUD and role handling in `src/users`.
- **Employees**: CRUD/profile in `src/employees`.
- **Locations**: CRUD/assignments in `src/locations`.
- **Shifts**: Scheduling CRUD in `src/shifts` (basic status support).
- **Availability**: Range-based availability controller in `src/availability`.
- **Common**: Guards/interceptors in `src/common`; Prisma service in `src/prisma`.

### Observations
- NestJS + Prisma v7; Prisma config via `prisma/prisma.schema` with PostgreSQL `DATABASE_URL`.
- Auth guards and organisation scoping present, but multi-tenant isolation needs verification across all queries.
- No migrations committed; relies on `prisma db push` per README.
- Missing modules: time tracking/clock-in, leave approvals, notifications, reporting/export, billing hooks.

## Frontend-v2 pages/components
- **App routes** (Next.js app router):
  - `/login`, marketing pages (`/cennik`, `/o-nas`, `/kontakt`).
  - Protected panel under `/panel` with sections: `dashboard`, `grafik`, `pracownicy`, `wnioski`, `profil`.
- **UI/logic**:
  - `app/panel/dashboard`: fetches shifts/employees/requests via `@/lib/api` with token from `@/lib/auth`.
  - `app/panel/grafik`: week calendar builder (needs confirmation of API wiring).
  - `app/panel/pracownicy`: employee list/form handling.
  - `app/panel/wnioski`: request list (likely mocked/limited).
  - Layout/atoms under `components/` and API helpers in `lib/api.ts`.

### Observations
- API base derived from env in `lib/api` but usage may still include demo data in some sections.
- Protected routing relies on manual token check; no global guard/refresh handling.
- UI lacks pagination/search across lists; skeletons/loading vary by page.
- No internationalization scaffold beyond Polish copy.

## Gap list
- **P0 (blocking)**
  - Reliable auth flow with refresh/session and route protection; unify API client with interceptors and error normalization.
  - Multi-tenant enforcement on all backend queries; add migrations/baseline schema.
  - End-to-end CRUD from UI for organisations, users, employees, locations, shifts (ensure real API, no demo data) with loading/error states.
  - Schedule builder must persist to backend (create/edit/delete) and reflect instantly.
- **P1**
  - Availability/time-off workflows with approvals; employee self-service views.
  - Notifications (in-app + email) with clear-all and per-type filters.
  - CSV import/export for employees/shifts; reporting dashboards.
  - Consistent search/filter/pagination across tables; responsive sidebar polish.
- **P2**
  - Billing/pricing plumbing and settings UX.
  - Internationalization framework (PL base).
  - Audit/change history for schedules; templates/copy week.
  - Time tracking/clock-in module and payroll exports.

## Recommended next steps
1. Stabilize API client (frontend) with base URL from env, token refresh, and shared error toasts.
2. Add Prisma migrations + seed with owner/admin + sample org; wire guards for tenant isolation.
3. Replace any mocked data in schedule/requests with real endpoints; add optimistic updates and skeletons.
4. Extend backend for leave/availability approvals and notifications; expose endpoints and connect UI.

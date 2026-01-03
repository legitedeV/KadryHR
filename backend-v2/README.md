## Backend v2 – status & usage

NestJS + Prisma backend focused on multi-tenant scheduling/HR primitives (organisations, users, employees, locations, shifts, availability).

### Current modules
- Stable: auth (JWT access/refresh), roles (OWNER/MANAGER/EMPLOYEE), organisations, users, employees, locations, shifts, availability (basic range validation), leave requests (types + approvals).
- Missing/next: time tracking/clock-in, notifications, reporting, payroll exports (see gap analysis).

### Run locally
1) Install dependencies: `npm install`
2) Copy env template: `cp .env.example .env` and set `DATABASE_URL` (PostgreSQL).
   - Optional hardening: tune `DATABASE_MAX_RETRIES` / `DATABASE_RETRY_DELAY_MS` if your DB can be slow to accept connections (e.g. cold starts or managed networks).
3) Generate Prisma client: `npx prisma generate` (run `npx prisma db push` or `npm run prisma:migrate` to sync schema).
4) Start dev server: `npm run start:dev` (port defaults to 3000).
5) Checks: `npm run lint` · `npm run test` · `npm run build`.

### Docs
- Architecture overview: `docs/BACKEND_V2_ARCHITECTURE.md`
- Feature gaps vs competitors: `docs/FEATURE_GAP_ANALYSIS.md`

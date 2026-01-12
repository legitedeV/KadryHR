## Backend v2 – status & usage

NestJS + Prisma backend focused on multi-tenant scheduling/HR primitives (organisations, users, employees, locations, shifts, availability).

### Current modules
- Stable: auth (JWT access/refresh), roles (OWNER/MANAGER/EMPLOYEE), organisations, users, employees, locations, shifts, availability (basic range validation), leave requests (types + approvals), notifications (inbox + preferences + optional email delivery).
- Missing/next: time tracking/clock-in, reporting, payroll exports (see gap analysis).

### Run locally
1) Install dependencies: `npm install`
2) Copy env template: `cp .env.example .env` and set `DATABASE_URL` (PostgreSQL).
   - Optional hardening: tune `DATABASE_MAX_RETRIES` / `DATABASE_RETRY_DELAY_MS` if your DB can be slow to accept connections (e.g. cold starts or managed networks).
   - Optional email: configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` to enable email notifications.
   - Optional marketing leads:
     - `LEADS_DEFAULT_ORGANISATION_ID` — organisation assigned to public leads (for sales/admin views).
     - `LEADS_NOTIFICATION_EMAIL` — address that receives new lead alerts.
     - `LEADS_AUTO_REPLY_ENABLED` — set to `false` to disable auto-replies.
     - `LEADS_IP_HASH_SALT` — salt for hashing IPs used in rate limiting.
3) Generate Prisma client: `npx prisma generate` (run `npx prisma db push` or `npm run prisma:migrate` to sync schema).
   - Re-run `npm run prisma:generate` whenever `prisma/schema.prisma` or `prisma.config.ts` changes (build no longer regenerates Prisma on every run).
4) Start dev server: `npm run start:dev` (port defaults to 3000).
5) Checks: `npm run lint` · `npm run test` · `npm run build`.

### Docs
- Architecture overview: `docs/BACKEND_V2_ARCHITECTURE.md`
- Feature gaps vs competitors: `docs/FEATURE_GAP_ANALYSIS.md`
 - Marketing pages: `docs/marketing-pages.md`

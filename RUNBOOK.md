# KadryHR Runbook

## Deployment
1. Ensure environment variables are set (see table below). Minimum required for production/staging:
   - `NODE_ENV=production` or `staging`
   - `PORT` (API) / `WEB_PORT` (Next.js, defaults to 3001)
   - `API_PREFIX` (defaults to `v2`)
   - `CORS_ORIGIN`
   - `JWT_SECRET`, `JWT_EXPIRES_IN`
   - `DATABASE_URL` (PostgreSQL for Prisma)
   - `SENTRY_DSN` (API) and `NEXT_PUBLIC_SENTRY_DSN` (web) for error monitoring
2. Build and start services using your preferred orchestrator:
   - Docker Compose example: `docker compose -f docker-compose.dev.yml up --build api web`
   - Bare metal: `npm run build --workspaces` then `npm run start --workspace apps/api` and `npm run start --workspace apps/web`.
3. Sentry instrumentation is enabled only in `production`/`staging` when the DSN variables are present. Tokens/cookies are redacted before sending events.
4. Security headers (HSTS, XSS, frame/cross-origin protections) are applied automatically by the API server. CORS must explicitly trust your frontend origin in production.

## Database migrations
1. Prisma is used for schema management in `apps/api`.
2. To create a new migration: `cd apps/api && npx prisma migrate dev --name <migration-name>`.
3. To apply migrations in staging/prod: `cd apps/api && npx prisma migrate deploy` (uses `DATABASE_URL`).
4. Before deploying, confirm migrations against a staging database. The API process should start only after a successful `migrate deploy` run.

## Mail queue worker
- A lightweight in-process queue (`MailQueueService`) runs with the API. It drains jobs every ~500ms and retries once on failure.
- Welcome emails are enqueued during registration; replace `deliver()` in `apps/api/src/notifications/mail-queue.service.ts` with SMTP/SES integration when credentials are available.
- No tokens are logged; only recipient and subject appear in worker logs.

## Backup and restore
1. **Database (PostgreSQL):**
   - Backup: `pg_dump $DATABASE_URL > backups/kadryhr_$(date +%F).sql`
   - Restore: `psql $DATABASE_URL < backups/kadryhr_<date>.sql`
   - For large datasets, prefer compressed dumps: `pg_dump -Fc $DATABASE_URL > backups/kadryhr.dump` and restore with `pg_restore`.
2. **File uploads (if using local storage in ./uploads):**
   - Archive: `tar -czf backups/uploads_$(date +%F).tar.gz uploads/`
   - Restore: `tar -xzf backups/uploads_*.tar.gz -C .`
3. **Sentry/monitoring configs:** environment-based only. Keep DSN secrets in your secrets manager; rotations require only env var updates and process restart.

## Operations checklist
- [ ] Confirm `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` present in prod/staging.
- [ ] Confirm `JWT_SECRET`, database URL, and CORS origins set before deploy.
- [ ] Run `npm run build --workspaces` and `npx prisma migrate deploy` before switching traffic.
- [ ] Validate health at `/v2/health` and version at `/v2/version` after deploy.
- [ ] Monitor Sentry for new events; investigate any rate-limit spikes from auth endpoints (register/login guarded by in-memory throttling).

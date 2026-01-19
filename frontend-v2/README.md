# Frontend v2

## Build and CI checks
- On the VPS, run only `npm run build` to keep deployments fast.
- In CI, always run `npm run ci:check` (lint + typecheck) before merging to `main`.
- If you need to run checks locally: `npm run lint` and `npm run typecheck`.

## Marketing pages
- Marketing routes live in `app/` (landing, pricing, security, legal).
- Lead form posts to `NEXT_PUBLIC_API_URL` + `/public/leads`.
- Default API base: `https://api.kadryhr.pl/api` (override with `NEXT_PUBLIC_API_URL`).
- Admin panel URL: `NEXT_PUBLIC_ADMIN_APP_URL` (defaults to `https://admin.kadryhr.pl`).
- Main app URL (used for cross-domain links): `NEXT_PUBLIC_APP_URL` (defaults to `https://kadryhr.pl`).
- Optional E2E: `npm run test:e2e` (Playwright).

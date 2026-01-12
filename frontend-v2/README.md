# Frontend v2

## Build and CI checks
- On the VPS, run only `npm run build` to keep deployments fast.
- In CI, always run `npm run ci:check` (lint + typecheck) before merging to `main`.
- If you need to run checks locally: `npm run lint` and `npm run typecheck`.

## Marketing pages
- Marketing routes live in `app/` (landing, pricing, security, legal).
- Lead form posts to `NEXT_PUBLIC_API_URL` + `/public/leads`.
- Optional E2E: `npm run test:e2e` (Playwright).

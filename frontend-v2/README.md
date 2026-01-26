# Frontend v2

## Build and CI checks
- On the VPS, run only `npm run build` to keep deployments fast.
- In CI, always run `npm run ci:check` (lint + typecheck) before merging to `main`.
- If you need to run checks locally: `npm run lint` and `npm run typecheck`.

## App scope
- The frontend only ships the core panel modules: Dashboard, Grafik, Dyspozycje, Profil.
- Default API base: `https://kadryhr.pl/api` (override with `NEXT_PUBLIC_API_URL`).
- Panel URL: `NEXT_PUBLIC_PANEL_APP_URL` (defaults to `https://kadryhr.pl`).
- Optional E2E: `npm run test:e2e` (Playwright).

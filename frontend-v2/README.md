# Frontend v2

## Build and CI checks
- On the VPS, run only `npm run build` to keep deployments fast.
- In CI, always run `npm run ci:check` (lint + typecheck) before merging to `main`.
- If you need to run checks locally: `npm run lint` and `npm run typecheck`.

## App scope
- The frontend only ships the core panel modules: Dashboard, Grafik, Dyspozycje, Profil.
- Default API base: `https://kadryhr.pl/api` (override with `NEXT_PUBLIC_API_URL`).
- Panel URL: `NEXT_PUBLIC_PANEL_APP_URL` (defaults to `https://kadryhr.pl`).
- Auth UI: Google OAuth is supported for login/registration; Microsoft OAuth UI has been removed.
- Optional E2E: `npm run test:e2e` (Playwright).

## Favicons (RealFaviconGenerator)
We use RealFaviconGenerator to manage the favicon set for the Next.js app.
Binary assets are not committed to the repository, so they must be downloaded
locally or on the server before running the app.

Run the setup script:

```bash
cd frontend-v2
bash scripts/setup-realfavicongenerator-favicons.sh
```

Run it on fresh clones, during deploys, or anytime you regenerate the favicon
package in RealFaviconGenerator.

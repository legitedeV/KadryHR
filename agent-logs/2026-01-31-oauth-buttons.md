# Run log: 2026-01-31-oauth-buttons

## Commands
- `rg -n "login|zaloguj|sign in|signin|register|rejestr" frontend-v2` (ok)
- `sed -n '1,220p' frontend-v2/app/login/page.tsx` (ok)
- `sed -n '1,220p' frontend-v2/lib/auth-context.tsx` (ok)
- `sed -n '1,160p' frontend-v2/app/panel/layout.tsx` (ok)
- `sed -n '1,200p' frontend-v2/scripts/screenshot-schedule-v2.mjs` (ok)
- `rg -n "btn-secondary|btn-outline|btn-ghost" frontend-v2/app/login/page.tsx frontend-v2/components frontend-v2/app -g"*.tsx"` (ok)
- `npm run build` (failed: next not found)
- `npm install` (failed: 403 Forbidden fetching lucide-react)
- `node frontend-v2/scripts/screenshot-oauth-buttons.mjs` (failed: @playwright/test not found)

## Outcomes
- Build failed due to missing Next.js binary (no node_modules).
- npm install blocked by registry 403.
- Screenshot script failed due to missing Playwright dependency.

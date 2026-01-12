# Marketing pages (Frontend V2)

## Overview
The marketing/landing experience lives in `frontend-v2` and is built with Next.js (App Router) and Tailwind CSS. The home page (`/`) and marketing sub-pages are ready for production deployment.

## Routes
- `/` — landing page
- `/cennik` and `/pricing` — pricing
- `/security` — security overview
- `/rodo` (`/privacy` redirects) — privacy and GDPR
- `/cookies` — cookie policy
- `/terms` — terms
- `/kontakt` (`/contact` redirects) — contact/demo form

## Lead capture
The demo form posts to the backend-v2 public endpoint.

### Required env vars (frontend)
- `NEXT_PUBLIC_API_URL` — backend API base, e.g. `https://api.kadryhr.pl/api`

### Backend lead capture
- `POST /api/public/leads`
- Uses rate limiting, honeypot protection, and queues email notifications.

## Testing
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npx playwright test` (after configuring Playwright)

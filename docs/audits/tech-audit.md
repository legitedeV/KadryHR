# Tech Audit — KadryHR (frontend-v2 + backend-v2)

## Scope
- Frontend: `frontend-v2` (Next.js App Router, React Query, Tailwind)
- Backend: `backend-v2` (NestJS, Prisma, Postgres)
- Critical route: `/panel/grafik`

## Findings & Fixes (Frontend)
### ✅ Fixed
- **Runtime crash on schedule page**: localStorage parsing for published weeks was unguarded. If storage contained invalid JSON, the schedule page crashed during initial render and fell into the global error boundary. The state initializer now validates JSON, filters values, and clears corrupt storage. 
- **Error visibility**: the global error boundary now logs a non-sensitive message containing route + requestId (if known) to `console.error`, enabling production debugging without exposing PII.
- **Request correlation**: API client now captures `x-request-id` for each API response, stores the latest requestId for debugging, and attaches it to `ApiError` instances.

### Remaining Risks
- **Schedule data fetches**: error states are shown, but no centralized client-side reporting pipeline exists (e.g., error logging endpoint). Consider adding a server-side log endpoint for frontend errors.
- **Unauthenticated UX**: `/panel/*` relies on token presence in localStorage; unauthorized experiences show inline errors instead of a consistent redirect. Consider a unified auth guard to reduce edge cases.

### Performance Quick Wins
- Consider API pagination for large employee lists (currently fetches 200 at once on schedule). 
- Cache schedule summary responses aggressively by week and location to reduce re-fetches.

## Findings & Fixes (Backend)
### ✅ Fixed
- **Missing request correlation**: backend now generates and returns `x-request-id` for every request and logs error responses (4xx/5xx) with requestId, method, path, and status. This improves observability without logging PII.
- **CORS headers**: `X-Request-Id` added to allowed headers so clients can pass an upstream id if available.

### Remaining Risks
- **Global error formatting**: errors are logged but response bodies do not include requestId; consider adding it to error response payloads for easier support.
- **Rate limiting**: no centralized rate limiting detected in main bootstrap; evaluate adding a per-IP limiter for auth endpoints.

## Observability Plan (Minimal, Production-Safe)
- **Frontend**: log boundary errors with route + requestId (from API headers or last known), no PII.
- **Backend**: assign `x-request-id`, log error responses only, avoid sensitive payloads.
- **Next steps**: optional endpoint for frontend error reporting, gated and sanitized.

## Summary of Key Endpoints for /panel/grafik
- Schedule, availability, and leave endpoints are accessed via `/api/...` with tenant scoping and auth guards.
- Ensure schedule-related endpoints return requestId headers for correlation.


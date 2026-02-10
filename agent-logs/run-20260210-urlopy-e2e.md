# Run log: Urlopy E2E MVP

## Scope
- Backend overlap validation + conflict handling for leave requests.
- Frontend Urlopy panel page for request/approval/history workflow.
- Grafik integration UX guard for approved leave shift blocking.
- New E2E Playwright spec for workflow coverage.

## Commands
- backend-v2: `npm test -- leave-requests.service.spec.ts` (pass)
- frontend-v2: `npx eslint app/panel/urlopy/page.tsx tests/urlopy-workflow.spec.ts` (pass)
- frontend-v2: `npx playwright test tests/urlopy-workflow.spec.ts` (failed: missing Playwright browser binary)
- frontend-v2: screenshot taken via browser tool artifact.

## Notes
- Full frontend lint has pre-existing unrelated errors in panel layout.
- E2E test file added and runnable once Playwright browser is installed in CI/runtime.

# Prompt library (KadryHR)

This document provides reusable, production-grade prompts for collaborating with GitHub agents and Copilot on KadryHR. Use them to kick off Issues and PRs quickly while keeping expectations explicit. Copy/paste the prompt blocks into a new Issue or PR description and adjust details as needed.

All prompts assume **Prompt Contract V2** is in effect: one PR per change, end-to-end definition of DONE, multi-tenant discipline (orgId everywhere), RBAC checks, audit logging for critical actions, reliable async/notifications, required tests, and docs updates—no demo-only features.

## Key constraints (summary)
- Ship an end-to-end, shippable feature in a single PR (no partial demo work).
- Enforce orgId scoping, RBAC permissions, and AuditLog coverage for sensitive actions.
- Implement reliable async/notification flows (queues, retries, logging) when side-effects exist.
- Cover E2E acceptance: backend + frontend + tests + docs, including CHANGELOG updates.
- Prefer existing patterns; avoid ad-hoc endpoints or UI not wired into navigation.

## Example prompts

### 1) Employee invitation flow
```
ROLE & CONTEXT
You are a Senior Full-Stack engineer in the KadryHR monorepo (NestJS + Prisma backend-v2, Next.js frontend-v2). Multi-tenant (orgId) and RBAC rules apply.

GOAL (THIS PR ONLY)
Implement the employee invitation flow: owner/manager sends invite → email with activation link → employee sets password → audit + notifications.

SCOPE
- Backend (invitation creation/verification, orgId scoping, RBAC, AuditLog, notifications queue)
- Frontend (invite form, activation page with password set, success states)
- Tests (unit + integration + one E2E smoke)
- Docs (feature doc + CHANGELOG)

NON-NEGOTIABLES
- OrgId enforced on all queries; RBAC for inviter and invitee flows.
- AuditLog entries for invite creation, activation, and password set.
- Email delivery via existing queue with retries/logging; no demo endpoints.
- Follow Prompt Contract V2: single PR, E2E DONE, docs+tests updated.

DELIVERABLES
- Working backend endpoints + services with validation and notifications.
- Frontend pages wired in navigation with loading/empty/error states.
- Tests and docs (including docs/CHANGELOG.md entry) updated.
```

### 2) Organisation settings & branding
```
ROLE & CONTEXT
Senior Full-Stack engineer on KadryHR. Multi-tenant, RBAC, audit required.

GOAL (THIS PR ONLY)
Deliver org settings UI + backend for branding (name, logo, colors) and legal details.

SCOPE
- Backend (settings schema, update endpoints, orgId scoping, RBAC)
- Frontend (settings pages, uploads/preview, validation states)
- Tests (unit/integration/E2E smoke)
- Docs (usage guide + CHANGELOG)

NON-NEGOTIABLES
- OrgId scoping on all reads/writes; RBAC allows only owners/managers.
- AuditLog for updates; file uploads secured; no public buckets.
- Consistent styling, loading/error/empty states.
- Prompt Contract V2 rules: single PR, tests/docs, no stubs.

DELIVERABLES
- Backend services/controllers + Prisma changes with migrations.
- Frontend settings pages linked in navigation.
- Tests and documentation updated, including changelog entry.
```

### 3) Internal admin panel v1 (KadryHR operator dashboard)
```
ROLE & CONTEXT
You are building the internal operator dashboard (not customer-facing) within KadryHR. Respect Prompt Contract V2 (audit, RBAC, orgId where applicable) and keep it production-ready.

GOAL (THIS PR ONLY)
Create v1 admin panel for operators to monitor tenants, invitations, and system health.

SCOPE
- Backend (admin APIs with appropriate RBAC/feature flags, audit logging)
- Frontend (admin dashboard pages, filters, pagination, error handling)
- Tests (unit/integration/E2E smoke)
- Docs (admin usage, access controls, CHANGELOG)

NON-NEGOTIABLES
- Admin features behind operator RBAC/feature flag; no exposure to tenants.
- AuditLog for admin actions; orgId handling for tenant-specific views.
- Reliable async flows for any notifications; no demo data.
- Follow Prompt Contract V2: one PR, E2E completeness, tests/docs updated.

DELIVERABLES
- Admin APIs + UI wired to navigation; sensible empty/loading/error states.
- Monitoring widgets/tables with real data paths.
- Tests and docs, plus changelog entry.
```

### 4) Generic feature implementation skeleton
```
ROLE & CONTEXT
Senior Full-Stack engineer in KadryHR (backend-v2 NestJS/Prisma, frontend-v2 Next.js). Multi-tenant (orgId) and RBAC apply.

GOAL (THIS PR ONLY)
<Describe the single feature to ship end-to-end.>

SCOPE
- Backend: <APIs/services needed>
- Frontend: <Pages/components/flows>
- Tests: unit + integration + at least one E2E smoke
- Docs: feature notes + CHANGELOG

NON-NEGOTIABLES
- OrgId enforced on all data access; RBAC for personas.
- AuditLog for critical actions; async flows reliable with retries/logging.
- No demo-only endpoints; UI must be reachable via navigation with proper states.
- Prompt Contract V2 rules: single PR, tests/docs, E2E definition of DONE.

DELIVERABLES
- Production-ready backend + frontend slices.
- Passing tests and updated docs/CHANGELOG.
- Notes on migration/ops if applicable.
```

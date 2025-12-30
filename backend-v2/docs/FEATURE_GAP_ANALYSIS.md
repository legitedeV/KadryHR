# Feature gap analysis (backend v2 vs. kadromierz.pl / global scheduling SaaS)

## Reference features from competitors
- Kadromierz promotes schedule builder, time tracking (RCP), leave/absence workflows, multi-location support, employee self-service (mobile), compliance hints, reporting/analytics.
- Global staff scheduling products (e.g., When I Work/Deputy-like) commonly include shift swapping, approvals, notifications, payroll/timesheet exports, and geofenced clock-in.

## Mapping to backend-v2

| Domain area | Backend v2 status | Notes |
| --- | --- | --- |
| Authentication & roles | **Implemented** | JWT access/refresh, roles (OWNER/MANAGER/EMPLOYEE), refresh token rotation. |
| Organisations & users | **Implemented** | Tenant model with organisation-scoped users; basic profile fields. |
| Employees directory | **Implemented** | CRUD with pagination helper; employee linked to user optionally. |
| Locations (multi-site) | **Implemented (basic)** | CRUD per organisation; no per-location permissions or reporting. |
| Shift scheduling | **Implemented (basic)** | CRUD for shifts with employee/location linkage; no recurrence, templates, conflict detection, or shift swapping. |
| Availability management | **Implemented (basic)** | CRUD for availability windows; no approvals or preferred hours caps. |
| Time tracking / clock-in | **Missing** | No attendance events, clock hardware/API, or overtime calculation. |
| Leave / absence workflows | **Missing** | No requests/approvals, balances, or calendar overlays. |
| Requests & approvals | **Missing/partial** | Only availability/shift CRUD; no manager approval flows. |
| Notifications | **Missing** | No email/push/webhook notifications for schedule changes or requests. |
| Reporting & analytics | **Missing** | No dashboards, exports, or cost/labour summaries. |
| Payroll/timesheet export | **Missing** | No wage rates or export formats. |
| Employee self-service | **Partial** | API endpoints exist but no scoped “my data” endpoints or guardrails for employees to edit limited fields. |
| Mobile readiness / integrations | **Missing** | No mobile-specific endpoints, webhooks, or external integrations. |
| Compliance helpers | **Missing** | No validation for labour-law rules (rest periods, overtime caps). |
| Onboarding/training | **Missing** | No checklists, documents, or certification tracking. |

## Quick wins to close gaps
- Add time/leave request flows with approvals and employee-facing scoped endpoints.
- Introduce shift templates, conflict detection, and optional swap/claim flows.
- Add attendance events (clock-in/out) and exportable timesheets/payroll hooks.
- Provide notifications (email/webhook) for shift changes and approvals.
- Layer reporting endpoints (labour cost, utilisation) and per-location summaries.

# Legacy Audit & Parity Matrix

## Legacy routing source
- React Router configuration lives in `apps/legacy-web/src/App.jsx` and enumerates all legacy paths plus guards.

## Legacy route inventory (with primary actions)
- `/` – Landing page with marketing hero and links to login/registration flows.
- `/login` – Email/password login with optional returnUrl redirection.
- `/register` – Invite-token-based account creation.
- `/qr/start` – Validate QR token and start a work session (captures geolocation, redirects to time tracking).
- `/app` – Dashboard with admin summaries, pending leaves/sick leaves, schedule preview, notifications (create/read), and availability submission.
- `/self-service` – Self-service center to submit leave requests and swap requests, plus quick views of my leaves.
- `/my-tasks` – Assigned task list with complete/reject actions and attachments/comments support.
- `/schedule-builder` – Primary schedule builder (V2) for shift creation/editing and publishing.
- `/schedule-builder/legacy` – Legacy builder kept for admin reference.
- `/time-tracking` – Clock-in/out via QR/manual entry, show status, recent entries, and manual QR generation.
- `/chat` – Internal chat with conversation list, message threads, sockets, and new-conversation flow.
- `/leaves` – All leaves (and sick leaves for admins) with status filtering.
- `/notifications` – Notification center with mark-as-read and clear-all operations.
- `/profile` – User profile view/edit (personal data, password, preferences).
- `/settings` – Organization settings including company data, branding, and integrations.
- `/employees` – Employee directory with create/delete, rate config, password generation, and credential copy.
- `/payroll` – Payroll runs with calculation, approvals, and exports.
- `/reports` – Reporting hub (payroll, attendance, compliance exports).
- `/invites` – Admin invite management (create/resend/revoke invites).
- `/permissions` – Role and permission mapping (RBAC management).
- `/webhooks` – Webhook endpoints configuration and test deliveries.
- `/tasks` – Admin task management (create/assign/update tasks, status control).
- `/qr-generator` – Generate QR codes for time tracking (per location/employee).
- `/admin/requests` – Admin review queue for employee/admin requests.

## Parity Matrix
Legacy Route | Feature | Status in V2 (OK/PARTIAL/MISSING) | Notes | Owner
--- | --- | --- | --- | ---
`/` | Landing CTA and onboarding links | PARTIAL | Domyślnie pokazuje nowy panel V2 z layoutem/sidebarem i kontekstem org; marketing/onboarding nadal brak | TBD
`/login` | Email/password login + return URL handling | OK | Logowanie przez API V2 (/v2/auth/login + /v2/auth/me), obsługa returnUrl i kontekstu orgId | TBD
`/register` | Invite-based tenant/user registration | MISSING | No registration flow in V2 | TBD
`/qr/start` | Verify QR token and start session with geolocation | MISSING | No equivalent flow in V2 | TBD
`/app` | Dashboard summaries, schedules, pending leaves, notifications, availability | MISSING | No dashboard route in V2 | TBD
`/self-service` | Submit leave and swap requests, view my leaves | MISSING | No self-service route in V2 | TBD
`/my-tasks` | View/complete/reject my tasks with comments/attachments | MISSING | No my-tasks route in V2 | TBD
`/schedule-builder` | Shift editor (multi-select, bulk edit, publish) | PARTIAL | V2 has schedule builder page but lacks auth/org integration and publish parity validation | TBD
`/schedule-builder/legacy` | Legacy builder reference | MISSING | No legacy builder equivalent in V2 | TBD
`/time-tracking` | Clock in/out via QR/manual, status, recent entries | MISSING | No time-tracking page in V2 | TBD
`/chat` | Conversations list, messages, sockets, new chat | MISSING | No chat UI in V2 | TBD
`/leaves` | All leaves & sick leaves list with filters | MISSING | No leaves route in V2 | TBD
`/notifications` | Notification center (mark read/clear) | MISSING | No notifications route in V2 | TBD
`/profile` | Profile view/edit incl. password/preferences | MISSING | No profile route in V2 | TBD
`/settings` | Org settings (company, branding, integrations) | MISSING | No settings route in V2 | TBD
`/employees` | Employee CRUD, rate config, credential gen/copy | MISSING | No employees route in V2 | TBD
`/payroll` | Payroll calculation/approval/export | MISSING | No payroll route in V2 | TBD
`/reports` | Reporting/exports hub | MISSING | No reports route in V2 | TBD
`/invites` | Invite lifecycle (create/resend/revoke) | MISSING | No invites route in V2 | TBD
`/permissions` | RBAC role/permission management | MISSING | No permissions route in V2 | TBD
`/webhooks` | Webhook configuration/testing | MISSING | No webhooks route in V2 | TBD
`/tasks` | Admin task creation/assignment/status control | MISSING | No tasks route in V2 | TBD
`/qr-generator` | QR code generation for time tracking | MISSING | No qr-generator route in V2 | TBD
`/admin/requests` | Admin review of inbound requests | MISSING | No admin/requests route in V2 | TBD

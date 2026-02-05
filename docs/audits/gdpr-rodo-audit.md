# GDPR/RODO Audit — KadryHR

## Administrator / Contact
- **Administrator**: Sebastian Aluk
- **Address**: Santocka 42A, 70-083 Szczecin
- **NIP**: 9552571739
- **Email**: Kontakt@kadryhr.pl

## Data Inventory (Observed/Implied)
- **Users**: name, email, role, password hashes, login metadata.
- **Employees**: personal details, contact data, employment metadata, availability, leave requests.
- **Schedules (Grafik)**: shift times, location assignments, position metadata, notes.
- **RCP (time tracking)**: check-in/check-out timestamps, location, device metadata (if captured).
- **Notifications**: email/SMS preferences, delivery logs.

## Legal Bases (Assumptions — confirm with counsel)
- **Contract necessity**: providing HR scheduling and time tracking services.
- **Legal obligation**: employment/time tracking records when required by local labor law.
- **Legitimate interest**: operational security logs, minimal analytics.

## Retention Recommendations
- **Access tokens**: short-lived, rotate with refresh logic.
- **Audit logs**: keep for minimum legal/operational period (e.g., 12–24 months), then purge.
- **RCP data**: align with labor law requirements; implement retention policy and deletion workflow.
- **Inactive employees**: anonymize after legal retention period.

## Data Subject Rights
- **Access**: export of employee data (profile, schedule, RCP, leave).
- **Rectification**: editable profile data and employment attributes.
- **Erasure**: delete/anonymize when lawful; ensure schedule and time data follow legal retention rules.
- **Restriction**: block processing during disputes.

## Security Controls (Observed/Required)
- **Access control**: role-based permissions for schedule, RCP, and employee data.
- **Tenant isolation**: organisation scoping enforced by backend interceptors.
- **Logging minimization**: avoid logging PII, only requestId + status.
- **Encryption**: TLS in transit; verify at-rest encryption in Postgres/backup layers.
- **Backups**: ensure encrypted backups with defined retention.

## Subprocessors
- **Unknown — needs confirmation**. No definitive subprocessor list found in repo/infra. Document confirmed email/SMS providers once validated.

## Gaps & Recommendations
- Document a clear **retention policy** and **data deletion workflow**.
- Add a **DSAR (data subject access request)** runbook.
- Add a **privacy notice** in product that references the administrator contact above.


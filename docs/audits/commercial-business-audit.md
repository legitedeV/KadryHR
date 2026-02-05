# Commercial & Business Audit — KadryHR

## Pricing & Packaging (MVP Suggestion)
- **Starter (per location)**: schedule + RCP + basic employee directory.
- **Growth**: multi-location, shift swaps, leave approvals, notifications.
- **Pro**: advanced reports, payroll exports, custom roles, SLA support.

## Onboarding Funnel Issues
- **First-use friction**: schedule UX requires employees/locations preconfigured; onboarding should prompt minimal required setup.
- **Role clarity**: owners/managers need clearer permission defaults and in-app guidance.
- **Data import**: lack of easy CSV import for employees slows time-to-value.

## “Żabka-fit” Operational Notes
- Focus on **multi-location** and **simple shift templates**.
- Emphasize **mobile RCP** with low-friction clock-in/out.
- Provide **manager approvals** for shift swaps and leave in one place.

## Risks & Mitigations
- **Reliability risk**: schedule route failure was not observable; add requestId logging (done) and centralized error reporting.
- **Support risk**: missing incident runbooks; add a “Known issues + resolution” playbook.
- **Compliance risk**: no documented retention policy; create policy and UI expectations.

## Priority Roadmap (2–4 weeks)
1. **Stability**: complete requestId plumbing and error reporting.
2. **Onboarding**: guided setup for locations/employees/first schedule.
3. **RCP**: refine mobile RCP flows + approvals.
4. **Commercial**: publish pricing & plan comparison + trial funnel.


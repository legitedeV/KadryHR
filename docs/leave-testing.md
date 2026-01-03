# Leave / Absence testing guide

## Commands
- Backend unit (leave logic): `cd backend-v2 && npx jest --config ./jest.config.ts src/leave-requests/leave-requests.service.spec.ts`
- Frontend dev: `cd frontend-v2 && npm run dev` (requires env set as in README)

## Scenarios
1. **Employee submits**: log in as employee, go to `/panel/wnioski`, choose leave type, set start/end, submit. Request appears in list with status `PENDING`.
2. **Manager approves/rejects**: as manager/owner, open the same view, select request, approve or reject. Notification should appear for the employee. Audit log entry is created.
3. **Employee cancels pending**: employee selects own `PENDING` request and cancels (status -> `CANCELLED`).
4. **Shift conflict rule**: ensure organisation flag `preventShiftOnApprovedLeave` is true (default in seed). Create approved leave for employee covering a day; attempt to assign shift overlapping that range in `/panel/grafik` and expect validation error.
5. **Leave types management**: manager creates a new leave type in `/panel/wnioski` (section “Typy urlopów”), toggles it inactive, and verifies it disappears from the creation select. Reactivate to make it available again.
6. **Calendar overlay**: approved leaves render markers inside `/panel/grafik` for corresponding employees/days.

## Edge cases
- Start date after end date should be rejected on both backend validation and UI guard.
- Status transitions allowed: `PENDING -> APPROVED/REJECTED/CANCELLED`, `APPROVED -> CANCELLED`; others rejected with error.
- Leave creation must be scoped to organisation and employee; employees can only see their own requests.
- Leave type references must belong to the same organisation and be active; otherwise creation/update should fail.

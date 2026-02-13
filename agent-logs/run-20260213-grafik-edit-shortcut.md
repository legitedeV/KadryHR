# /panel/grafik edit shortcut audit (2026-02-13)

## Scope inspected
- `frontend-v2/features/schedule-v2/SchedulePage.tsx`
- `frontend-v2/app/panel/grafik/page.tsx`

## Audit findings
- `page.tsx` is only a thin wrapper rendering `<SchedulePage />`; there are no page-level keyboard handlers.
- In `SchedulePage.tsx`, keyboard handling for `E` is bound to `onKeyDown` of `data-testid="grafik-grid-root"` and gated by `isGridActive()`.
- `E` handling was implemented as **hold-to-enable** (`EDIT_MODE_HOLD_MS = 1000`) + `onKeyUp` cancellation, not a press-to-toggle.
- Result: a normal quick `e` press does not toggle edit mode, so users observe “nothing happens”.

## Root cause (confirmed)
1. Listener scope mismatch for product expectation: shortcut requires focused/active grid, not global page scope.
2. Behavior mismatch: shortcut requires holding `E` for ~1s; quick press intentionally never enables edit mode.

This confirms the regression against the expected “press `e` toggles edit mode” behavior.

# Cycle HU - Event Detail Retail Chart Surface

## Polymarket Reference Behavior

- Reference direction from the mobile Polymarket game-page screenshots and S23 reference checks: the game page keeps the prediction chart readable and lets the user inspect movement from the chart area, while the default trade path stays focused on market/outcome selection and ticket entry.
- Polymarket does not make internal/debug controls, order-book entry points, or live-stat-like strips the main default retail flow for the current Local MVP scope.

## Holiwyn Acceptance Criteria

| Priority | Criterion | Verification |
| --- | --- | --- |
| P0 | Event Detail top surface exposes a cleaner retail chart marker: `event-detail-chart-retail-surface-fit`. | S23 XML proof. |
| P0 | Default Local MVP Event Detail hides order-book UI and does not reintroduce live-stat/chat/social surfaces. | S23 XML negative assertions. |
| P0 | Chart interaction is available from the chart surface itself through `event-detail-chart-touch-surface`. | Typecheck plus S23 hierarchy proof. |
| P0 | The chart cleanup does not break the route-backed line market, ticket, swipe-submit, fake-token server order, or Portfolio History path. | S23 Local MVP filled totals proof. |
| P0 | Backend route/schema/order logic remains unchanged. | Git diff and typecheck. |
| P1 | Full Polymarket chart touch animation, time ranges, and richer history remain tracked for later chart parity. | Gap tracker. |

## Implementation Notes

- `src/components/EventDetail.tsx` hides the live-match strip and point/filter controls from the visible Local MVP surface while keeping provider/chart metadata available to proof labels.
- The chart line area is now a direct press target that cycles selected chart points and reveals tooltip metadata.
- `scripts/smoke.ps1` now requires `event-detail-chart-retail-surface-fit` in the Local MVP top-page proof.

## Audit Gate

- Status: pass.
- Required device: Samsung S23 `SM-S911U1`.
- Proof folder: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HU-event-detail-retail-chart-surface-s23-proof-final-pass`.
- Harness folder: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HU-event-detail-retail-chart-surface-s23-proof-final-pass`.
- Result: the chart surface is visibly cleaner, order-book UI remains hidden, the route-backed Totals ticket still submits through the swipe flow, and Portfolio History shows the server-backed activity.

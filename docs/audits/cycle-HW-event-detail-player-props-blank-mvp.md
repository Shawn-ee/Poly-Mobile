# Cycle HW - Event Detail Player Props Blank MVP Gate

## Polymarket Reference Behavior

- Polymarket exposes market-category tabs on game pages, including props when available.
- Current Holiwyn product direction keeps World Cup prediction markets in scope and leaves Player Props blank for this MVP.

## Holiwyn Acceptance Criteria

| Priority | Criterion | Verification |
| --- | --- | --- |
| P0 | Tapping Player Props shows `event-detail-player-props-blank-local-mvp`. | S23 XML proof. |
| P0 | Player Props blank state does not expose unbuilt market rows, route-backed line-market outcomes, or ticket entry. | S23 XML negative assertions. |
| P0 | Returning to Game Lines restores the line-market ticket path. | S23 Local MVP filled proof. |
| P0 | Backend routes and schemas are unchanged. | Git diff and typecheck. |

## Implementation Notes

- `EventDetail` adds an explicit blank-MVP accessibility marker to the Player Props empty state.
- `scripts/smoke.ps1` taps Player Props, verifies the blank state, taps Game Lines, and then continues the route-backed Totals ticket proof.

## Audit Gate

- Status: pass.
- Required device: Samsung S23 `SM-S911U1`.
- Proof folder: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HW-event-detail-player-props-blank-mvp-s23-proof-pass`.
- Harness folder: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HW-event-detail-player-props-blank-mvp-s23-proof-pass`.
- Result: Player Props is explicitly blank for the Local MVP, does not expose fake markets/tickets, and Game Lines still completes the route-backed ticket/order/Portfolio path.

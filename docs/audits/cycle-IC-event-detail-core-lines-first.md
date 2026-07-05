# Cycle IC - Event Detail Core Lines First

## Scope

Event Detail Game Lines market list in the Local MVP route-backed totals betting flow.

## Acceptance Criteria

| Criterion | Priority | Holiwyn result |
| --- | --- | --- |
| Half-winner groups should not be expanded by default when the user is trying to reach core full-game line markets. | P0 | Passed. `first-half-winner` and `second-half-winner` now default collapsed; S23 proof rejects expanded half rows such as `Breadth Home 1H`, `Tie 1H`, and `Breadth Home 2H`. |
| The route-backed totals line market must still be discoverable and open the simple ticket. | P0 | Passed. S23 proof verifies `ticket-source-backend-line-market`, selected totals line `2.5`, Polymarket provider source/token, and ticket-open handoff. |
| Full Local MVP trade path must remain intact. | P0 | Passed. Same S23 proof completes ticket amount entry, upward swipe buy, Portfolio, Portfolio top, and grouped History. |
| Backend/API contracts should remain unchanged for this visible line-list cycle. | P0 | Passed. No backend route, schema, request, or response changes were made. |

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Result: pass
- Line-market screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IC-event-detail-core-lines-first-s23-proof\cycle-EY-holiwyn-route-server-mvp-line-markets.png`
- Summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IC-event-detail-core-lines-first-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Remaining Gaps

Exact Polymarket market ordering, native collapse animation, and full market group discovery remain future parity work. This cycle keeps scope to reducing default half-market clutter around the MVP line-ticket path.

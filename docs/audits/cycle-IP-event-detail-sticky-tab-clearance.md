# Cycle IP - Event Detail Sticky Tab Clearance

## Scope

Local MVP visible mobile flow: Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

This cycle improves the Event Detail sticky Game Lines rail. It does not change backend order logic, deposits, withdrawals, chat, live stats, social features, or order book UI.

## Reference Behavior

The Polymarket game page keeps sticky navigation visually separated from market content as the user scrolls. Holiwyn's S23 line-market proof showed the sticky `Game Lines / Player Props` rail too close to the next market group, making it feel like the rail was slicing into the content.

## Acceptance Criteria

| Criteria | Priority | Result |
| --- | --- | --- |
| Sticky market tabs expose a clearance marker in the S23 line-market proof. | P0 | Pass |
| The line-market screenshot shows the next market group starting below the sticky rail with visible breathing room. | P0 | Pass |
| Player Props blank state still works. | P0 | Pass |
| Totals line ticket, swipe submit, Portfolio, and History still pass on S23. | P0 | Pass |
| No backend route/schema/order logic changes are introduced. | P0 | Pass |
| Exact native sticky-header scroll physics. | P2 | Tracked |

## Implementation Notes

- `src/components/EventDetail.tsx`: adds `event-detail-sticky-tab-content-clearance` to sticky market tabs and gives the sticky shell bottom clearance.
- `scripts/smoke.ps1`: requires the sticky-tab clearance marker in route-backed line-market proofs.

## API/Data Dependencies

No backend/API change. Event Detail still uses the same:

- event markets and outcomes
- selected line/period/provider identity
- `POST /api/orders`
- `GET /api/portfolio`
- Portfolio History state

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Result: pass
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8360 -OutputDir docs\mobile\screenshots\cycle-IP-event-detail-sticky-tab-clearance-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-IP-event-detail-sticky-tab-clearance-s23-proof`

Proof artifacts:

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IP-event-detail-sticky-tab-clearance-s23-proof\cycle-EY-holiwyn-route-server-mvp-line-markets.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IP-event-detail-sticky-tab-clearance-s23-proof\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IP-event-detail-sticky-tab-clearance-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IP-event-detail-sticky-tab-clearance-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Audit Gate

Pass. P0 gaps for this cycle are closed. Remaining P2 gap: exact native sticky-header scroll physics.

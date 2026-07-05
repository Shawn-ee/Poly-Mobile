# Cycle JM - Portfolio Orders Empty State Route Proof

## Polymarket Reference

- Portfolio uses a profile/value/chart header followed by `Positions`, `Orders`, and `History` tabs.
- When the user opens `Orders` and there are no open orders, Polymarket shows a quiet centered `No open orders` empty state instead of a card or debug message.
- The empty Orders tab should still preserve the account header, chart, range selector, and tab rail context.

## Acceptance Criteria

| Criteria | Priority | Result |
| --- | --- | --- |
| After a route-backed filled fake-token order, the user can open Portfolio `Orders` and see a centered `No open orders` state. | P0 | Pass |
| The Orders empty state is visibly quiet and unboxed, while the Portfolio header/chart/tab context remains present. | P0 | Pass |
| The same route-backed proof continues to History and preserves selected market/line/provider identity. | P0 | Pass |
| No backend/order route, schema, orderbook, chat, or live-stats work is touched. | P0 | Pass |

## Implementation Notes

- `Portfolio` now gives the Orders empty state its own centered style and accessibility markers.
- `scripts/smoke.ps1` now taps `Orders` in the route-backed filled server proof, captures the empty state, then continues to `History`.

## Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Result: pass.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8405 -OutputDir docs\mobile\screenshots\cycle-JM-portfolio-orders-empty-state-route-proof -HierarchyOutputDir docs\mobile\harness\cycle-JM-portfolio-orders-empty-state-route-proof`.
- Orders screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JM-portfolio-orders-empty-state-route-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-orders.png`.
- Orders XML: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JM-portfolio-orders-empty-state-route-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-orders.xml`.
- Flow proof summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JM-portfolio-orders-empty-state-route-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

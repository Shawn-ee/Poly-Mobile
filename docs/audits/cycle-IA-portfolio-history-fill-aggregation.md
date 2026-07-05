# Cycle IA - Portfolio History Fill Aggregation

## Scope

Local MVP Portfolio History after a server-backed fake-token buy that fills against multiple maker asks.

## Acceptance Criteria

| Criterion | Priority | Holiwyn result |
| --- | --- | --- |
| A single user-submitted buy should appear as one retail History row, even when backend matching creates multiple fill rows. | P0 | Passed. `recentTradesToActivity` groups same-selection fills in the same execution window and keeps an `orderId` grouping path ready for backend support. |
| The grouped row must preserve amount, shares, weighted execution price, selected line, period, provider source, and provider token identity. | P0 | Passed. S23 XML shows one grouped row with `75 USDT`, `portfolio-history-fill-count-3`, totals line `2.5`, `Reg. Time`, and Polymarket provider token/source markers. |
| Existing one-fill recent trade rows should keep their stable IDs and behavior. | P0 | Passed. Focused unit test keeps single-fill `trade-{id}` mapping. |
| The full route-backed Android flow must still pass on Samsung S23. | P0 | Passed. S23 proof completed Home/Event Detail/Ticket swipe/Portfolio/History. |

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Result: pass
- Screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IA-portfolio-history-fill-aggregation-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- Summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IA-portfolio-history-fill-aggregation-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Backend/Data Contract Notes

`GET /api/portfolio/history` currently returns individual recent trade fills without a durable user order/execution grouping field. Mobile now supports optional `recentTrades[].orderId` and should switch to a durable backend-provided `orderId` or `executionGroupId` when the route/schema adds one. The current same-selection short-window fallback is acceptable for Local MVP UI proof, but it is tracked as P1 backend contract debt.

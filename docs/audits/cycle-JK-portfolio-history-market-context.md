# Cycle JK - Portfolio History Market Context

## Reference behavior

- The Polymarket Portfolio History reference uses compact activity rows with action, side/outcome, event, amount, and time.
- Activity titles should carry enough market context to be understood without relying only on an internal shorthand such as `Over 2.5`.

## Holiwyn criteria

| Criterion | Priority | Status |
| --- | --- | --- |
| A route-backed totals History row shows a readable title such as `Bought Yes Over 2.5 total goals`. | P0 | Pass |
| The row keeps the compact Polymarket-like History layout with event, market subline, amount, and relative time. | P0 | Pass |
| Hidden proof identity still preserves market type, line, period, provider token/source, order-time display label, amount, and timestamp. | P0 | Pass |
| Backend/order route contracts remain unchanged. | P0 | Pass |
| Exact History row typography and final visual polish remain later work. | P2 | Tracked |

## Implementation notes

- `src/components/Portfolio.tsx` now derives activity titles through the same market-aware label path used by Positions.
- `scripts/smoke.ps1` requires `portfolio-history-market-context-readable` and the visible `Over 2.5 total goals` label in the S23 route-backed Portfolio History proof.
- No backend route, schema, order service, order book, chat, live stats, deposit, withdraw, or location-check work is part of this cycle.

## Device proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8401 -OutputDir docs\mobile\screenshots\cycle-JK-portfolio-history-market-context-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-JK-portfolio-history-market-context-s23-proof`.
- Result: pass.
- History screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JK-portfolio-history-market-context-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`.
- History XML proof: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JK-portfolio-history-market-context-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.xml`.
- Flow proof summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JK-portfolio-history-market-context-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

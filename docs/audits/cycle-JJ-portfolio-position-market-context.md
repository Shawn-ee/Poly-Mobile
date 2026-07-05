# Cycle JJ - Portfolio Position Market Context

## Reference behavior

- The Polymarket Portfolio reference uses position titles that include simple market context, for example `Over 3.5 total goals`, rather than only shorthand outcome text.
- The row stays compact: event/score context, outcome title, cost/to-win/entry, current value/chance, and Cash out/add actions.

## Holiwyn criteria

| Criterion | Priority | Status |
| --- | --- | --- |
| A route-backed totals position shows a readable title such as `Yes Over 2.5 total goals`. | P0 | Pass |
| The row keeps the compact Polymarket-like Portfolio layout and does not reintroduce internal provider copy as visible text. | P0 | Pass |
| Hidden proof identity still preserves market type, line, period, provider token/source, and order-time display label. | P0 | Pass |
| Backend/order route contracts remain unchanged. | P0 | Pass |
| Exact row typography and final visual polish remain later work. | P2 | Tracked |

## Implementation notes

- `src/components/Portfolio.tsx` now derives market-aware visible labels for totals and team-total positions from existing `selection.marketType` and `selection.line`.
- `scripts/smoke.ps1` requires `portfolio-position-market-context-readable` and the visible `Over 2.5 total goals` label in the S23 route-backed Portfolio proof.
- No backend route, schema, order service, order book, chat, live stats, deposit, withdraw, or location-check work is part of this cycle.

## Device proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8400 -OutputDir docs\mobile\screenshots\cycle-JJ-portfolio-position-market-context-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-JJ-portfolio-position-market-context-s23-proof`.
- Result: pass.
- Portfolio screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JJ-portfolio-position-market-context-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio.png`.
- Portfolio XML proof: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JJ-portfolio-position-market-context-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio.xml`.
- Flow proof summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JJ-portfolio-position-market-context-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

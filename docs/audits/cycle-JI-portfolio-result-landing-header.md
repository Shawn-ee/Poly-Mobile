# Cycle JI - Portfolio Result Landing Header

## Reference behavior

- The Polymarket Portfolio reference starts with the profile/account identity, large portfolio value, P/L plus cash line, performance chart, range selector, and Portfolio tabs.
- Positions and history are still reachable below the account/value header, but the first impression is the account surface, not a mid-page cropped row.

## Holiwyn criteria

| Criterion | Priority | Status |
| --- | --- | --- |
| After a successful S23 trade, Portfolio lands at the account/value header instead of a deep scroll offset. | P0 | Pass |
| The first post-order Portfolio hierarchy includes profile header, value card, performance chart, range selector, tabs, and the created position. | P0 | Pass |
| Position, Orders, and History proof remains available after the landing change. | P0 | Pass |
| Backend/order route contracts remain unchanged. | P0 | Pass |
| Exact Portfolio pixel polish remains later visual work. | P2 | Tracked |

## Implementation notes

- `src/components/Portfolio.tsx` changes the latest-order result scroll target from `y: 1240` to `y: 0`.
- The Portfolio screen exposes `portfolio-result-lands-at-account-header` for device proof.
- `scripts/smoke.ps1` now requires the post-order route-backed Portfolio proof to include the account header/value/chart/range selectors as well as the position row.
- No backend route, schema, order service, order book, chat, live stats, deposit, withdraw, or location-check work is part of this cycle.

## Device proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8399 -OutputDir docs\mobile\screenshots\cycle-JI-portfolio-result-landing-header-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-JI-portfolio-result-landing-header-s23-proof`.
- Result: pass.
- Portfolio landing screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JI-portfolio-result-landing-header-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio.png`.
- Portfolio XML proof: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JI-portfolio-result-landing-header-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio.xml`.
- Flow proof summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JI-portfolio-result-landing-header-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

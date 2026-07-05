# Cycle JA - Portfolio Position Gap S23 Fit

## Reference

The user-provided Polymarket Portfolio reference shows position rows beginning directly below the Positions/Orders/History tab rail. Holiwyn's S23 post-trade landing had a large blank gap because hidden proof metadata rendered between the tabs and visible position row.

## Acceptance Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| The first position row begins directly below the Portfolio tab rail on Samsung S23. | P0 | Pass |
| Hidden proof metadata remains available for order/position/count assertions. | P0 | Pass |
| The route-backed Local MVP flow still completes Event Detail -> ticket -> fake-token order -> Portfolio -> History. | P0 | Pass |
| No backend route/schema/order logic changes are introduced for visible layout. | P0 | Pass |
| Exact Polymarket row spacing and typography. | P2 | Tracked |

## Implementation

- `src/components/Portfolio.tsx` moves sync/count/latest-order proof nodes below visible tab content instead of between tabs and positions.
- Position rows expose `portfolio-position-tabs-gap-closed-s23`.
- `scripts/smoke.ps1` asserts that marker in the route-backed server-filled Portfolio proof.

## Device Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8387 -OutputDir docs\mobile\screenshots\cycle-JA-portfolio-position-gap-s23-fit-proof-final -HierarchyOutputDir docs\mobile\harness\cycle-JA-portfolio-position-gap-s23-fit-proof-final`.
- Result: pass.
- Key evidence:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JA-portfolio-position-gap-s23-fit-proof-final\cycle-EY-holiwyn-route-server-mvp-portfolio.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JA-portfolio-position-gap-s23-fit-proof-final\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JA-portfolio-position-gap-s23-fit-proof-final\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Remaining Gaps

- P2: exact Polymarket row spacing and typography remain for a later visual parity cycle.

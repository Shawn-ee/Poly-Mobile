# Cycle IY - Portfolio Dollar Row Amounts

## Reference

The user-provided Polymarket Portfolio screenshots show the account header, positions, and history using simple dollar notation for user-facing amounts. Holiwyn already keeps fake-token accounting internally, but visible Portfolio rows should feel like the retail mobile reference instead of showing internal `USDT` row copy.

## Acceptance Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Position rows show visible cost/current value/PnL/to-win amounts with `$` notation. | P0 | Pass |
| History rows show visible trade amount with `$` notation. | P0 | Pass |
| Selected market, outcome, line, period, provider source/token, and amount identity remain available for proof and future backend work. | P0 | Pass |
| The route-backed Local MVP path still completes Event Detail -> ticket -> fake-token order -> Portfolio -> History on Samsung S23. | P0 | Pass |
| No backend route/schema/order logic changes are introduced for visible formatting. | P0 | Pass |
| Exact Polymarket typography/pixel polish. | P2 | Tracked |

## Implementation

- `src/components/Portfolio.tsx` adds visible row dollar formatting through `portfolioRowMoney`.
- Position row labels now include `portfolio-row-dollar-amounts`.
- History row labels now include `portfolio-history-dollar-amounts`.
- `scripts/smoke.ps1` now asserts `Cost $75` and `$75` in the S23 server-filled Portfolio proof.

## Device Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8384 -OutputDir docs\mobile\screenshots\cycle-IY-portfolio-dollar-row-amounts-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-IY-portfolio-dollar-row-amounts-s23-proof`.
- Result: pass.
- Key evidence:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IY-portfolio-dollar-row-amounts-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IY-portfolio-dollar-row-amounts-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IY-portfolio-dollar-row-amounts-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Remaining Gaps

- P2: exact Portfolio row typography and pixel polish remain to be compared in a later visual parity cycle.

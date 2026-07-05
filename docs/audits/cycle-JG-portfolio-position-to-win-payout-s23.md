# Cycle JG - Portfolio Position To-Win Payout

## Reference behavior

- Polymarket Portfolio position rows show `Cost`, `To win`, and `Entry` as order economics.
- `To win` represents payout if the position wins, not merely the current position value or original cost.

## Holiwyn criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Position row `To win` uses payout-style value. | P0 | Pass |
| Payout display preserves selected line/provider identity. | P0 | Pass |
| Full Local MVP trade path still reaches Portfolio History after fake-token order submission. | P0 | Pass |
| Backend/order contracts remain unchanged. | P0 | Pass |
| Exact Portfolio typography. | P2 | Tracked |

## Implementation notes

- Touched `src/components/Portfolio.tsx` and `scripts/smoke.ps1`.
- Added `positionPotentialPayout`, preferring backend-provided filled shares and falling back to `amount / entryProbability`.
- Added proof marker `portfolio-position-to-win-payout`.
- No backend/API/order logic changed.

## Device proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8397 -OutputDir docs\mobile\screenshots\cycle-JG-portfolio-position-to-win-payout-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-JG-portfolio-position-to-win-payout-s23-proof`.
- Result: pass.
- Screenshots and XML:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JG-portfolio-position-to-win-payout-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JG-portfolio-position-to-win-payout-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio.xml`

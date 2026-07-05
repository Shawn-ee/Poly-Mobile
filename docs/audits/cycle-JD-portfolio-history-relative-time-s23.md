# Cycle JD - Portfolio History Relative Time

## Reference behavior

- Polymarket Portfolio History uses compact relative time for recent activity, such as `Just now` or `2 hr. ago`, instead of a full absolute timestamp in the row.
- The timestamp sits on the right side under the dollar amount and should be low-contrast secondary information.

## Holiwyn criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| History row renders compact relative time for recent trades. | P0 | Pass |
| Raw timestamp remains available in proof/accessibility metadata. | P0 | Pass |
| Full Local MVP flow still reaches Portfolio History after fake-token order submission. | P0 | Pass |
| Backend/order contracts remain unchanged. | P0 | Pass |
| Exact Portfolio typography and older-history grouping. | P2 | Tracked |

## Implementation notes

- Touched `src/components/Portfolio.tsx` and `scripts/smoke.ps1`.
- Added timestamp parsing and relative-time formatting for existing activity timestamp strings.
- Updated smoke proof to check the relative-time format marker instead of a brittle exact minute string.
- No backend/API/order logic changed.

## Device proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8394 -OutputDir docs\mobile\screenshots\cycle-JD-portfolio-history-relative-time-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-JD-portfolio-history-relative-time-s23-proof`.
- Result: pass.
- Screenshots and XML:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JD-portfolio-history-relative-time-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JD-portfolio-history-relative-time-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.xml`

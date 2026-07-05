# Cycle JE - Event Detail Compact Chart Trade Rail

## Reference behavior

- Polymarket's mobile game page keeps the chart handoff lightweight: the selected outcome/probability is visible near the chart, but it does not become a large dashboard card before the primary outcome buttons and market tabs.
- The trade action should remain obvious without consuming a large vertical block.

## Holiwyn criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Chart selected-market handoff is compact and no longer a framed card. | P0 | Pass |
| Selected market/outcome identity remains in proof metadata. | P0 | Pass |
| Trade action remains available from the chart handoff. | P0 | Pass |
| Full Local MVP trade path still reaches Portfolio History after fake-token order submission. | P0 | Pass |
| Backend/order contracts remain unchanged. | P0 | Pass |
| Exact chart physics and tooltip behavior. | P2 | Tracked |

## Implementation notes

- Touched `src/components/EventDetail.tsx` and `scripts/smoke.ps1`.
- Removed visible `Selected market` eyebrow and card chrome from the chart contract rail.
- Added proof markers `event-detail-chart-contract-compact-strip` and `event-detail-chart-contract-card-removed`.
- No backend/API/order logic changed.

## Device proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8395 -OutputDir docs\mobile\screenshots\cycle-JE-event-detail-compact-chart-trade-rail-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-JE-event-detail-compact-chart-trade-rail-s23-proof`.
- Result: pass.
- Screenshots and XML:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JE-event-detail-compact-chart-trade-rail-s23-proof\cycle-EY-holiwyn-route-server-mvp-top.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JE-event-detail-compact-chart-trade-rail-s23-proof\cycle-EY-holiwyn-route-server-mvp-top.xml`

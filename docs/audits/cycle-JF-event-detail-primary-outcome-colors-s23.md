# Cycle JF - Event Detail Primary Outcome Colors

## Reference behavior

- Polymarket's mobile soccer game page uses strong green/red trading colors for the two opposing primary outcomes.
- The same side color carries through header probability text, chart emphasis, and primary buy/action buttons.

## Holiwyn criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Primary winner outcome buttons use green/red instead of two blue tones. | P0 | Pass |
| Header probability and chart selected outcome use the same green/red presentation. | P0 | Pass |
| Selected market/outcome identity and ticket handoff remain unchanged. | P0 | Pass |
| Full Local MVP trade path still reaches Portfolio History after fake-token order submission. | P0 | Pass |
| Backend/order contracts remain unchanged. | P0 | Pass |
| Exact production team artwork/color sourcing. | P2 | Tracked |

## Implementation notes

- Touched `src/components/EventDetail.tsx` and `scripts/smoke.ps1`.
- Added a presentation-only primary outcome color helper for the first two match-winner outcomes.
- Added proof markers `event-detail-primary-outcome-retail-green-red` and `event-detail-primary-outcome-colors-polymarket-like`.
- No backend/API/order logic changed.

## Device proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8396 -OutputDir docs\mobile\screenshots\cycle-JF-event-detail-primary-outcome-colors-s23-proof -HierarchyOutputDir docs\mobile\harness\cycle-JF-event-detail-primary-outcome-colors-s23-proof`.
- Result: pass.
- Screenshots and XML:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JF-event-detail-primary-outcome-colors-s23-proof\cycle-EY-holiwyn-route-server-mvp-top.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JF-event-detail-primary-outcome-colors-s23-proof\cycle-EY-holiwyn-route-server-mvp-top.xml`

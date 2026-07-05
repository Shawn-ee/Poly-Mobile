# Event Detail Chart Probability Axis Audit

## Cycle HA - Event Detail Chart Probability Axis

- Scope: Local MVP Event Detail chart presentation in the path `Home -> Event Detail -> line market -> ticket -> fake-token order -> Portfolio/history`.
- Reference behavior: Polymarket soccer game pages present probability movement as percentage-oriented market movement, not dollar/P&L-looking axis labels.
- Holiwyn gap: the Event Detail chart axis used visible `+$9`, `+$39`, and `+$479` labels, which made the chart read like a cash-value graph instead of a probability chart.
- Backend/API route changes: none. Existing chart history/status contracts are unchanged.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Event Detail chart shows probability-axis labels `75%`, `50%`, and `25%`. | Pass |
| P0 | Event Detail chart no longer exposes the old visible `+$9`, `+$39`, or `+$479` labels. | Pass |
| P0 | Chart presentation change preserves the Local MVP line selection, ticket, fake-token submit, Portfolio, Orders, and History flow. | Pass |
| P0 | The Android proof folder/script naming matches this cycle and branch. | Pass |
| P1 | Final native chart gesture/tooltip physics should keep moving closer to Polymarket. | Tracked |

## Audit Gate Result

- Device proof: Samsung tablet `SM_X526C`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8268 -OutputDir docs/mobile/screenshots/cycle-HA-event-detail-chart-probability-axis -HierarchyOutputDir docs/mobile/harness/cycle-HA-event-detail-chart-probability-axis`.
- Result: pass.
- Evidence:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HA-event-detail-chart-probability-axis\cycle-current-holiwyn-event-detail.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HA-event-detail-chart-probability-axis\cycle-current-holiwyn-event-detail.xml`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HA-event-detail-chart-probability-axis\cycle-HA-local-mvp-trade-flow-proof.json`

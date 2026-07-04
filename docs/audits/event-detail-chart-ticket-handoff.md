# Event Detail Chart Ticket Handoff Audit

## Reference

Polymarket's mobile event page lets the user press the probability chart to inspect a point before choosing an outcome or opening the order flow. The important MVP behavior is that the selected chart state is visible and does not break the simple retail trade path.

## Holiwyn Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Pressing a chart point changes the visible chart readout. | P0 | Android screenshot/XML includes selected point and tooltip state. |
| The selected chart point is reflected near the selected contract before the user opens the ticket. | P0 | Android screenshot/XML includes `event-detail-chart-contract-point`. |
| The chart Trade action opens the full-screen simple ticket without exposing the hidden order book path. | P0 | Android screenshot/XML includes `trade-ticket`, `ticket-selection-summary`, and no default orderbook entry points. |
| The selected market/outcome identity remains available to the ticket handoff. | P0 | Android XML includes selected contract/market/outcome labels on the chart Trade action and ticket summary. |
| Exact Polymarket continuous press/drag tooltip physics. | P2 | Deferred. |

## Cycle GB Result

- Implementation: `EventDetail` now shows the selected chart point in the contract rail and includes the selected chart point in the chart Trade accessibility label.
- Backend/API impact: none. The readout uses the existing chart state and selected ticket identity already present in mobile.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpStatusFlow -Port 8241 -OutputDir docs/mobile/screenshots/cycle-GB-event-detail-chart-ticket-handoff -HierarchyOutputDir docs/mobile/harness/cycle-GB-event-detail-chart-ticket-handoff`.
- Audit status: P0 pass. Remaining P2 work is exact native chart gesture physics.

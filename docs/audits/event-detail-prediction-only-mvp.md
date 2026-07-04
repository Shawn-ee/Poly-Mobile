# Event Detail Prediction-Only MVP Audit

## Reference And Product Direction

The current Local MVP is prediction-first: Home -> Event Detail -> chart/probability -> line selector -> Buy/Sell ticket -> fake-token order -> Portfolio/history.

Polymarket exposes social/chat/share surfaces, but Holiwyn's current MVP direction explicitly excludes chat, live stats, notifications, location checks, deposits, withdrawals, and nonessential social features. Event Detail should therefore prioritize the chart, selected contract, line markets, simple ticket entry, and Portfolio handoff.

## Holiwyn Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Default Event Detail header does not expose Chat or Share controls. | P0 | Android XML lacks `event-detail-tab-chat` and `event-detail-share`. |
| Default Event Detail body does not show chat preview or live stats tabs/panels. | P0 | Android XML lacks `event-detail-chat-preview`, `event-detail-body-tab-live-stats`, and `event-detail-live-stats-panel`. |
| Chart, selected contract rail, and Trade ticket handoff remain available. | P0 | Android XML includes chart and ticket handoff labels. |
| Market lines remain reachable after social/live-stats UI is hidden. | P0 | Android proof scrolls to Spread/Totals and selects a spread line. |
| Exact future social/chat/share parity. | P2 | Out of current Local MVP scope. |

## Cycle GC Result

- Implementation: `EventDetail` now presents a single Game/prediction header pill, removes the default Share action, removes the visible Chat entry point, removes the visible Live stats tab, and removes the chat preview card.
- Backend/API impact: none. Existing market, chart, ticket, and fake-token order contracts are unchanged.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpStatusFlow -Port 8242 -OutputDir docs/mobile/screenshots/cycle-GC-event-detail-prediction-only -HierarchyOutputDir docs/mobile/harness/cycle-GC-event-detail-prediction-only`.
- Audit status: P0 pass. Future social/chat/share parity remains P2/out of current Local MVP scope.

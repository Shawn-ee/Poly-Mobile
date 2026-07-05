# Cycle GQ - Event Detail Simple Chart Trade Rail

## Reference audit

The user's Polymarket order and game-page screenshots show a retail-first interaction: users pick an outcome/line, see a simple current price/probability, and open the ticket. Operational provider labels, fallback-source warnings, and internal route states should not be visible in the default Local MVP event page.

## Holiwyn criteria

- P0: The default Event Detail chart area must expose a simple selected-contract trade rail with the selected outcome/line and current probability.
- P0: Provider/chart lifecycle details may remain in accessibility metadata for proof, but they must not be rendered as prominent visible user text in the default Local MVP chart area.
- P0: The chart selected team/percentage label must not visibly overlap the chart outcome chips.
- P0: The simple rail must still open the existing Buy/Sell ticket and preserve selected market/line/outcome identity through Portfolio/history.
- P0: No backend/API route changes are required for this presentation cycle.
- P1: Future route-backed chart history should replace the fallback chart state, but that backend/provider work is outside this visual cycle.

## Audit gate

Status: Passed.

- Device: Samsung tablet `SM_X526C`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8256 -OutputDir docs/mobile/screenshots/cycle-GQ-event-detail-simple-chart-trade-rail -HierarchyOutputDir docs/mobile/harness/cycle-GQ-event-detail-simple-chart-trade-rail`.
- Result: pass.
- Evidence: `cycle-current-holiwyn-event-detail.png` shows the simplified Event Detail chart rail as `Selected / Mexico / Current 64% / Trade` with no visible chart fallback warning pill. `cycle-current-holiwyn-event-detail.xml` exposes `event-detail-simple-chart-trade-rail`, `event-detail-chart-open-ticket`, and `Current 64%`.
- Flow proof: `cycle-GQ-local-mvp-trade-flow-proof.json` passed through Event Detail, selected spread line, ticket, fake-token order, Portfolio, Orders, and History.
- Remaining P0 gaps: 0.

# Cycle GR - Event Detail Market Status Hidden

## Reference audit

The current Local MVP direction is a retail betting flow: choose event, choose line/outcome, open ticket, submit fake-token order, then review Portfolio/history. Backend/provider availability labels such as `Market live`, `Market stale`, and `Market unavailable` are useful diagnostics, but they should not be prominent visible UI in the default betting list.

## Holiwyn criteria

- P0: Default Event Detail market headers should prioritize the market title, selected line, period selector, and outcome prices.
- P0: Backend/provider availability state may remain in accessibility/proof metadata, but the visible `Market live/stale/unavailable` pill should be hidden from the default Local MVP betting UI.
- P0: Line selectors and outcome rows must remain visible and usable.
- P0: The full Local MVP ticket/order/Portfolio/history flow must still pass on Android.
- P0: No backend/API route changes are required for this presentation cycle.

## Audit gate

Status: Passed.

- Device: Samsung tablet `SM_X526C`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8257 -OutputDir docs/mobile/screenshots/cycle-GR-event-detail-market-status-hidden -HierarchyOutputDir docs/mobile/harness/cycle-GR-event-detail-market-status-hidden`.
- Result: pass.
- Evidence: `cycle-GR-holiwyn-local-mvp-selected-line.png` shows Spread and Totals headers without the visible `Market live` status pill, while line selectors and outcome rows remain visible.
- Flow proof: `cycle-GR-local-mvp-trade-flow-proof.json` passed through selected line, ticket, fake-token order, Portfolio, Orders, and History.
- Remaining P0 gaps: 0.

# Cycle GS - Event Detail Line Card Actions

## Reference audit

The active Local MVP target is the retail betting path: choose market/outcome, inspect graph/about context, open a simple ticket, submit fake-token order, and review Portfolio/history. The Team to Advance line card still showed extra icon-only actions after Graph/About that were not part of the current prediction flow.

## Holiwyn criteria

- P0: The default Team to Advance line card should expose prediction-related `Graph` and `About` tabs only.
- P0: Extra non-MVP icon-only actions should not appear in the default line-card action strip.
- P0: The line card must still show its outcome buttons and inline graph.
- P0: The full Local MVP ticket/order/Portfolio/history flow must still pass on Android.
- P0: No backend/API route changes are required for this presentation cycle.

## Audit gate

Status: Passed.

- Device: Samsung tablet `SM_X526C`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8258 -OutputDir docs/mobile/screenshots/cycle-GS-event-detail-line-card-actions -HierarchyOutputDir docs/mobile/harness/cycle-GS-event-detail-line-card-actions`.
- Result: pass.
- Evidence: `cycle-GS-holiwyn-local-mvp-market-lines.png` shows the Team to Advance line card with only `Graph` and `About` in the action strip. `cycle-GS-holiwyn-local-mvp-market-lines.xml` exposes `event-detail-line-detail-tabs prediction-tabs-only`.
- Flow proof: `cycle-GS-local-mvp-trade-flow-proof.json` passed through selected line, ticket, fake-token order, Portfolio, Orders, and History.
- Remaining P0 gaps: 0.

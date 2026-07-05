# Event Detail Card Simple Retail Flow Audit

## Cycle HC - Event Detail Card Simple Retail Flow

- Scope: Local MVP Event Detail game-lines surface in `Home -> Event Detail -> line market -> ticket -> fake-token order -> Portfolio/history`.
- Reference behavior: the MVP event page should keep prediction choices and line markets prominent. Non-functional chart/about placeholders inside a market card should not distract from the retail trade path.
- Holiwyn gap: the Team to Advance card still showed a `Graph / About` strip and a cyan `Line movement` placeholder, even though the card's useful MVP behavior is choosing an outcome or continuing into line markets.
- Backend/API route changes: none.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Team to Advance card keeps visible outcome buttons and `Winner market` context. | Pass |
| P0 | Default Local MVP card no longer shows `Graph`, `About`, `event-detail-line-detail-tabs`, or `event-detail-inline-graph`. | Pass |
| P0 | Spread/totals line selectors, ticket entry, fake-token order, Portfolio, Orders, and History still pass on Android. | Pass |
| P0 | No order book, chat, live stats, watchlist, or funding behavior is introduced. | Pass |
| P1 | If a real market-card graph is reintroduced later, it must be backed by useful chart data and its own audit gate. | Tracked |

## Audit Gate Result

- Device proof: Samsung tablet `SM_X526C`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8270 -OutputDir docs/mobile/screenshots/cycle-HC-event-detail-card-simple-retail-flow -HierarchyOutputDir docs/mobile/harness/cycle-HC-event-detail-card-simple-retail-flow`.
- Result: pass.
- Evidence:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HC-event-detail-card-simple-retail-flow\cycle-HC-holiwyn-local-mvp-market-lines.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HC-event-detail-card-simple-retail-flow\cycle-HC-holiwyn-local-mvp-market-lines.xml`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HC-event-detail-card-simple-retail-flow\cycle-HC-local-mvp-trade-flow-proof.json`

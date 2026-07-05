# Portfolio Value Curve Retail Flow Audit

## Cycle HB - Portfolio Value Curve Retail Flow

- Scope: Local MVP Portfolio page after `Home -> Event Detail -> line market -> ticket -> fake-token order -> Portfolio/history`.
- Reference behavior: the Polymarket Portfolio reference presents the account-value chart as a prominent green performance curve, not a flat placeholder line.
- Holiwyn gap: the chart renderer scaled the current account values against zero, so a normal `$10K` account with a `$25` move looked almost perfectly flat.
- Backend/API route changes: none. Existing fallback and future backend value-history contracts remain unchanged.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Portfolio value chart scales against its account-value range so the local MVP proof shows visible movement. | Pass |
| P0 | Portfolio XML exposes `portfolio-chart-scaled-account-range` so the Audit Gate can reject the old flat scaling behavior. | Pass |
| P0 | Chart improvement preserves range selector, Positions, Orders, History, Buy more, Cash out, and fake-token order flow. | Pass |
| P0 | No order book, chat, live stats, watchlist, or funding behavior is introduced. | Pass |
| P1 | Real persisted backend value history should replace deterministic fallback when the backend route is available. | Tracked |

## Audit Gate Result

- Device proof: Samsung tablet `SM_X526C`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8269 -OutputDir docs/mobile/screenshots/cycle-HB-portfolio-value-curve-retail-flow -HierarchyOutputDir docs/mobile/harness/cycle-HB-portfolio-value-curve-retail-flow`.
- Result: pass.
- Evidence:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HB-portfolio-value-curve-retail-flow\cycle-HB-holiwyn-local-mvp-portfolio.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HB-portfolio-value-curve-retail-flow\cycle-HB-holiwyn-local-mvp-portfolio.xml`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HB-portfolio-value-curve-retail-flow\cycle-HB-local-mvp-trade-flow-proof.json`

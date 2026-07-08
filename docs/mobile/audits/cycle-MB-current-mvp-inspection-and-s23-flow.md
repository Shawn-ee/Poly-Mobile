## Cycle MB - Current MVP Inspection And S23 Visible Flow

Scope:

- Reinspect the current Local MVP service/app state before continuing the broader loop.
- Prove the current visible S23 path: Home -> Event Detail -> Spread line ticket -> swipe-to-buy -> Portfolio open order -> History empty state.
- Prove the backend route lifecycle separately for filled Portfolio/history.

Inspection result:

- `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` returns two live match events plus one future.
- `argentina-vs-egypt` and `switzerland-vs-colombia` each expose 7 markets.
- Regulation Winner is provider-backed from Polymarket (`referenceSource=polymarket`).
- Spread, Totals, and Team Total Goals are backend-shaped `contract-fixture` markets because the inspected Polymarket event does not expose attach-ready line rows.

Path adjustment:

- Continue Local MVP visible flow using the current live match events.
- Do not treat missing provider-backed Spread/Totals/Team Total markets as a blocker while Polymarket Gamma exposes no attach-ready line rows.
- Keep line markets visibly labeled and documented as `contract-fixture` until provider-backed line ingestion is possible.
- Prioritize visible open-order/filled-history clarity next, because the S23 UI order currently lands as an open order while backend route proof can fill and return history.

Implementation:

- Added `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`.
- Tightened `TradeTicket` swipe submit to use drag responder handling and removed tap-to-submit from the swipe control.
- Updated the S23 proof to use a deliberate long upward swipe that crosses the submit threshold.

Acceptance criteria:

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| MB-P0-01 | P0 | Current backend inspection identifies real provider-backed Regulation Winner and explicit contract-fixture line markets. | Pass |
| MB-P0-02 | P0 | Backend route proof can create a fake-token line order and preserve selected market/line/token into Portfolio and History. | Pass |
| MB-P0-03 | P0 | S23 Home shows the current match event, not stale EL-A/FI proof data. | Pass |
| MB-P0-04 | P0 | S23 Event Detail shows Game Lines with Spread/Totals/Team Total and no orderbook/chat UI. | Pass |
| MB-P0-05 | P0 | S23 ticket preserves selected Spread line `1.5` and `contract-fixture` source. | Pass |
| MB-P0-06 | P0 | S23 swipe-to-buy reaches Portfolio and preserves line/source identity in the open order state. | Pass |
| MB-P1-01 | P1 | S23 visible UI order fills immediately and appears in History. | Open; current visible order lands as open order. Backend route proof covers filled history. |

Validation:

- `npx tsx scripts/inspect_mobile_mvp_current_state.ts --cycle=MB --summaryPath=docs/mobile/harness/cycle-MB-current-state-inspection/cycle-MB-current-state-inspection.json`
- `npx tsx scripts/prove_mobile_mvp_home_to_portfolio_journey.ts --cycle=MB --summaryPath=docs/mobile/harness/cycle-MB-home-to-portfolio-route-journey/cycle-MB-home-to-portfolio-route-journey.json`
- `npm run -s typecheck` from `mobile/`
- `powershell -ExecutionPolicy Bypass -File scripts/prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8289 -ExpoHost 172.16.200.14 -MobileApiBaseUrl http://172.16.200.14:3002 -BackendBaseUrl http://127.0.0.1:3002 -EventSlug argentina-vs-egypt -Cycle MB`

Device proof:

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Proof summary: `docs/mobile/harness/cycle-MB-current-mvp-s23-visible-flow/cycle-MB-current-mvp-s23-visible-flow.json`
- Screenshots:
  - `docs/mobile/screenshots/cycle-MB-current-mvp-s23-visible-flow/cycle-MB-current-mvp-home.png`
  - `docs/mobile/screenshots/cycle-MB-current-mvp-s23-visible-flow/cycle-MB-current-mvp-detail-top-retry.png`
  - `docs/mobile/screenshots/cycle-MB-current-mvp-s23-visible-flow/cycle-MB-current-mvp-lines.png`
  - `docs/mobile/screenshots/cycle-MB-current-mvp-s23-visible-flow/cycle-MB-current-mvp-ticket-ready.png`
  - `docs/mobile/screenshots/cycle-MB-current-mvp-s23-visible-flow/cycle-MB-current-mvp-after-submit.png`
  - `docs/mobile/screenshots/cycle-MB-current-mvp-s23-visible-flow/cycle-MB-current-mvp-portfolio-history.png`

Remaining gaps:

- Real provider-backed line markets remain unavailable for inspected matches.
- Visible UI order submit currently produces an open order; immediate filled History requires seeded/crossing liquidity or a market-order fill path.
- Home card center tap did not always navigate in automation; title-area tap does. Keep watching this in manual testing.

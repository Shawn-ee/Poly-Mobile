## Cycle MC - Visible Filled History For Local MVP Line Ticket

Scope:

- Continue the inspection-first Local MVP loop after confirming service readiness.
- Prove the visible Samsung S23 path: Home -> Event Detail -> Spread line ticket -> swipe-to-buy -> filled Portfolio position -> History trade row.
- Keep the cycle limited to the retail betting flow. No orderbook, chat, live stats, social, watchlist, or schema work.

Inspection result:

- `GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` still exposes `argentina-vs-egypt` as an MVP-ready match.
- Regulation Winner is provider-backed from Polymarket.
- Spread/Totals/Team Total markets are still backend-shaped `contract-fixture` rows. This is intentional for Local MVP because no attach-ready provider line markets are mapped for the inspected match.
- The previous visible proof left old S23 proof BUY orders open on `Egypt +1.5` at `0.52`, which prevented fresh counterparty seeding from resting cleanly.

Implementation:

- Updated `scripts/seed_mobile_route_spread_counterparty.ts` to target a specific line and optionally cancel stale automated proof BUY orders on the exact selected market/outcome before seeding maker liquidity.
- Updated `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` to seed `argentina-vs-egypt` Spread `1.5` away-side liquidity and require filled History.
- Updated `scripts/prove_mobile_mvp_home_to_portfolio_journey.ts` so the backend route proof also clears only stale automated proof BUY orders on the exact selected market/outcome.

Acceptance criteria:

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| MC-P0-01 | P0 | Backend route proof fills a Home-selected Spread `1.5` order and preserves selected market/outcome/line/token/source into Portfolio and History. | Pass |
| MC-P0-02 | P0 | S23 Home opens the current `argentina-vs-egypt` match. | Pass |
| MC-P0-03 | P0 | S23 Event Detail shows Game Lines and hides orderbook/chat UI. | Pass |
| MC-P0-04 | P0 | S23 ticket preserves selected Spread line `1.5` and `contract-fixture` source. | Pass |
| MC-P0-05 | P0 | S23 swipe-to-buy submits only through the swipe path and reaches Portfolio. | Pass |
| MC-P0-06 | P0 | S23 Portfolio History shows the filled line-market trade, not only an open order or empty state. | Pass |

Validation:

- `npm run -s typecheck` from `mobile/`
- `npx tsx scripts/prove_mobile_mvp_home_to_portfolio_journey.ts --cycle=MC --summaryPath=docs/mobile/harness/cycle-MC-visible-filled-history/cycle-MC-home-to-portfolio-route-journey.json`
- `powershell -ExecutionPolicy Bypass -File scripts/prove_mobile_current_mvp_s23_visible_flow.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Cycle MC -OutputDir docs\mobile\screenshots\cycle-MC-visible-filled-history -HierarchyOutputDir docs\mobile\harness\cycle-MC-visible-filled-history -SeedCounterparty -ExpectFilledHistory`

Device proof:

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Proof summary: `docs/mobile/harness/cycle-MC-visible-filled-history/cycle-MC-current-mvp-s23-visible-flow.json`
- Counterparty proof: `docs/mobile/harness/cycle-MC-visible-filled-history/cycle-MC-current-mvp-counterparty.json`
- Screenshots:
  - `docs/mobile/screenshots/cycle-MC-visible-filled-history/cycle-MC-current-mvp-home.png`
  - `docs/mobile/screenshots/cycle-MC-visible-filled-history/cycle-MC-current-mvp-detail-top.png`
  - `docs/mobile/screenshots/cycle-MC-visible-filled-history/cycle-MC-current-mvp-lines.png`
  - `docs/mobile/screenshots/cycle-MC-visible-filled-history/cycle-MC-current-mvp-ticket-ready.png`
  - `docs/mobile/screenshots/cycle-MC-visible-filled-history/cycle-MC-current-mvp-after-submit.png`
  - `docs/mobile/screenshots/cycle-MC-visible-filled-history/cycle-MC-current-mvp-portfolio-history.png`

Remaining gaps:

- Real provider-backed Spread/Totals/Team Total markets remain unavailable for the inspected match and are still represented by backend-shaped `contract-fixture` rows.
- The current visible fill proof depends on local seeded counterparty liquidity. Production liquidity and provider-backed line ingestion remain future milestones.

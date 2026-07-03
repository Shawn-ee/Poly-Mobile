# Live Event Detail Audit

Status: Cycle AT backend/chart hydration in progress. Cycle AN passed structural live event detail UI with backend-shaped fixture data and tablet proof; Cycle AO added the real `/api/events/:slug` contract for market identity, line identity, compact depth, and optional chart/live-stat arrays. Cycle AQ sources embedded chart history from `MarketOutcomeSnapshot` rows when available and preserves depth outcome identity in mobile. Cycle AR adds the dedicated `/api/markets/:marketId/chart?range=...` route/client contract. Cycle AS wires EventDetail to consume that chart route in server mode. Cycle AT adds deterministic `MarketOutcomeSnapshot` seeding for local/server proof. This is still not full backend parity because real provider ingestion, server-hydrated device proof, loading/error chart states, and full depth routes remain open.

## Scope

- Feature: World Cup live football game detail.
- Reference device: Samsung S23 running Polymarket Android experience.
- Holiwyn proof device: Samsung tablet running Holiwyn through Expo Go.
- Cycle branch name: `mobile/cycle-AN-saved-watchlist-parity`, re-scoped honestly to live event detail after product steering changed.
- Out of scope: deposit, location verification, notifications, non-football live markets, World Cup informational ad/detail pages.

## Reference Audit

Observed Polymarket behavior:

- Live tab shows a World Cup rail/list of football games with time, league, team flags, team names, odds multipliers, and large probability buttons.
- Opening/tapping around the Australia vs Egypt row reached or exposed a game-detail-style surface when location gating appeared earlier: top Game/Chat control, book/share controls, teams, probabilities, a large probability chart, chat preview, primary outcome buttons, and Game Lines/Player Props tabs.
- Location verification may appear as a production gate. Per product direction, Holiwyn must not implement or match this gate in fake-token development mode.
- The useful product behavior is the live prediction surface: live context, live odds/probabilities, chart movement, market groups, ticket carry-through, and grouped line markets.

Reference evidence:

- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-list.png`
- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-detail-top.png`
- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-detail-markets.png`
- `docs/mobile/reference/screenshots/cycle-AN-polymarket-live-detail-open-attempt.png`

## Holiwyn Acceptance Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-P0-01 | P0 | Live detail opens directly from a live football event route and shows live match context, not a generic stats dashboard. | Tablet screenshot/XML | Pass |
| LED-P0-02 | P0 | Top live game page keeps Game/Chat controls, book/share controls, team codes/probabilities, score/clock, chart, chat card, primary outcome buttons, and Game Lines/Player Props tabs. | Tablet screenshot/XML | Pass |
| LED-P0-03 | P0 | Live market groups include more than one bare winner market and expose live winner, spreads, totals, halves, and team-total structure. | Tablet scrolled screenshot/XML | Pass |
| LED-P0-04 | P0 | Tapping a live outcome opens a ticket that preserves event, market, and outcome identity. | Tablet ticket screenshot/XML | Pass |
| LED-P0-05 | P0 | Fixture data used for frontend parity is backend-shaped with stable ids and contract fields, not display-only random data. | Code review | Pass |
| LED-P1-01 | P1 | Backend routes should provide live market groups, line options, chart history, orderbook depth, live stats, and selected identity. | Route/schema audit | Partial: `/api/events/:slug` now provides market/line/outcome identity, compact depth, snapshot-backed chart history when `MarketOutcomeSnapshot` rows exist, and optional live-stat arrays; `/api/markets/:marketId/chart?range=...` now provides a dedicated range-aware chart contract; EventDetail consumes that route in server mode; deterministic local snapshot seeding exists; real provider ingestion, server-hydrated device proof, loading/error chart states, and full depth routes remain open. |
| LED-P1-02 | P1 | Portfolio/open-order/activity should preserve live selected market/line/outcome identity after live orders. | API/mobile service tests | Pass for structural backend/mobile contract in Cycle AP; repeat live-device server proof after provider data is wired. |
| LED-P2-01 | P2 | Visual density and animation should be tightened against a cleaner unblocked Polymarket game-detail reference. | Future side-by-side audit | Open |

## Holiwyn Evidence

- `docs/mobile/screenshots/cycle-current-holiwyn-live-detail-top.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-live-detail-markets.png`
- `docs/mobile/screenshots/cycle-current-holiwyn-live-detail-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-live-detail-top.xml`
- `docs/mobile/harness/cycle-current-holiwyn-live-detail-markets.xml`
- `docs/mobile/harness/cycle-current-holiwyn-live-detail-ticket.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:live-detail`

## Audit Gate

Result: Pass for Cycle AN focused structural live-event-detail UI and contract-shaped fixture scope.

Unresolved P0 gaps: 0 for this focused scope.

Remaining P1/P2 gaps:

- Real backend/schema support is missing for live market groups, chart history, live stats, and orderbook depth.
- Portfolio/order/activity preservation for live line identity still needs a dedicated backend-shaped proof.
- Full visual parity still needs a cleaner unblocked Polymarket detail reference, but location verification is not a Holiwyn product requirement.

## Cycle AO Contract Audit

Result: Partial pass for the backend/mobile contract portion of LED-P1-01.

What became materially closer to Polymarket:

- Live event-detail markets now have stable backend route fields for market group identity, market type, period, line, selected outcome side, quote sizes, compact orderbook depth, and optional chart/live-stat arrays.
- The mobile adapter now consumes those fields instead of dropping them, so future server-hydrated live game pages can preserve line/outcome identity into ticket state.

Evidence:

- `src/server/services/marketReadModel.ts`
- `src/server/services/eventReadModel.ts`
- `mobile/src/types.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `cmd /c npm.cmd run test:ci -- src/__tests__/sports.event-market-model.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`

Unresolved P0 gaps: 0 for the backend contract increment.

Remaining P1 gaps:

- Real provider ingestion for live stats/chart history is not implemented.
- Full market history and depth ladder routes are still missing.
- PM-GAP-068 live order-to-portfolio/history identity is structurally verified by Cycle AP route/service tests; live-device server proof should be repeated after real live data is wired.

## Cycle AP Order Identity Audit

Result: Pass for the PM-GAP-068 backend/mobile identity contract.

What became materially closer to Polymarket:

- Ticket submission now preserves selected market, line, period, side, outcome, and contract side through the server order request.
- Portfolio open orders, positions, canceled orders, and recent-trade activity now expose the same selection identity to mobile instead of collapsing to plain market/outcome text.

Evidence:

- `src/server/services/ticketSelectionMetadata.ts`
- `src/server/services/canonicalOrderSubmission.ts`
- `src/app/api/portfolio/route.ts`
- `src/app/api/portfolio/history/route.ts`
- `mobile/src/services/orderService.ts`
- `mobile/src/services/portfolioSnapshotService.ts`
- `mobile/src/services/portfolioHistoryService.ts`
- `cmd /c npm.cmd run test:ci -- src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:event-detail-line-portfolio`

Unresolved P0 gaps: 0 for the PM-GAP-068 structural contract.

Remaining P1/P2 gaps:

- Device proof should be repeated with server-hydrated live line markets after PM-GAP-067 real provider/depth work.
- First-class `Order.selection` and `Trade.selection` columns may be needed before production if request-body reconstruction is not durable enough.

## Cycle AQ Chart/Depth Contract Audit

Result: Partial pass for the PM-GAP-067 chart-history/depth-identity backend contract.

What became materially closer to Polymarket:

- Polymarket live charts are historical probability surfaces, not static local drawings. Holiwyn can now hydrate `event.chartHistory` from first-class `MarketOutcomeSnapshot` rows on `/api/events/:slug`.
- Embedded orderbook depth remains tied to `outcomeId` after mobile normalization, so later depth UI can point each bid/ask level at the selected outcome instead of using anonymous display rows.

Evidence:

- `src/server/services/marketReadModel.ts`
- `src/server/services/eventReadModel.ts`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/mocks/worldCup.ts`
- `cmd /c npm.cmd run test:ci -- src/__tests__/sports.event-market-model.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/worldCupAdapter.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:live-detail`

Unresolved P0 gaps: 0 for this backend contract increment.

Remaining P1 gaps:

- Real live-football provider ingestion must write snapshot rows and live stats.
- Dedicated range-aware history and full orderbook ladder routes are still missing.
- Samsung/tablet proof should be repeated with server-hydrated live event data once provider/fixture seeding creates snapshot rows for a live game.

## Cycle AR Market Chart Route Audit

Result: Partial pass for the PM-GAP-067 dedicated chart-history route/client contract.

What became materially closer to Polymarket:

- Polymarket live chart behavior is range-aware and history-backed. Holiwyn now has a dedicated `/api/markets/:marketId/chart?range=1D|1W|1M|MAX` contract with generated time, last-updated, empty state, outcome ids, and mobile-ready probability history points.
- Mobile now has `PolyApi.getMarketChart()` and typed `MarketChart` models, so the visible EventDetail chart can move from embedded/mock history to server route hydration in the next UI integration cycle.

Evidence:

- `src/app/api/markets/[id]/chart/route.ts`
- `src/__tests__/public.market-chart.no-leak.test.ts`
- `mobile/src/api.ts`
- `mobile/src/types.ts`
- `mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run test:ci -- src/__tests__/public.market-chart.no-leak.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`

Unresolved P0 gaps: 0 for this backend/client contract increment.

Remaining P1 gaps:

- EventDetail does not yet call the dedicated chart route.
- Real provider ingestion must populate `MarketOutcomeSnapshot` rows for live World Cup markets.
- Device proof still needs a server-hydrated chart-data run once backend health/live snapshot seeding is available.

## Cycle AS EventDetail Chart Hydration Audit

Result: Partial pass for the PM-GAP-067 visible EventDetail chart-route hydration path.

What became materially closer to Polymarket:

- Polymarket live game charts behave like data-backed probability history surfaces. Holiwyn EventDetail now calls the dedicated market chart route in server mode and can replace local/embedded chart points with route-provided history for the selected primary market.
- The visible chart now carries a `chart-source-market-chart-route` audit label when route data is applied, so future Samsung/tablet proof can distinguish true backend hydration from fixture fallback.

Evidence:

- `mobile/src/services/marketChartService.ts`
- `mobile/src/__tests__/marketChartService.test.ts`
- `mobile/App.tsx`
- `mobile/src/components/EventDetail.tsx`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:live-detail`

Unresolved P0 gaps: 0 for this route-hydration integration increment.

Remaining P1 gaps:

- Backend health was unavailable during tablet proof, so this cycle could not capture server-hydrated chart-source device XML.
- Real live-football provider ingestion must write snapshot rows and live stats.
- Loading, empty, delayed, suspended, and route-error states remain open.
- Full orderbook/depth ladder support remains open.

## Cycle AT Live Chart Snapshot Seeding Audit

Result: Partial pass for PM-GAP-067 provider-shaped chart data harness.

What became materially closer to Polymarket:

- Polymarket live charts require backend probability history, not frontend-only local arrays. Holiwyn now has a deterministic local/proof harness that writes real `MarketOutcomeSnapshot` rows for live World Cup outcomes, which are the same rows consumed by `/api/events/:slug` and `/api/markets/:marketId/chart`.
- This moves the repeated provider/snapshot gap from "unknown future data" to a concrete backend data path that can be run when local services are available.

Evidence:

- `src/server/services/mobileLiveChartSnapshotSeeding.ts`
- `scripts/seed_mobile_live_chart_snapshots.ts`
- `src/__tests__/mobile-live-chart-snapshot-seeding.test.ts`
- `package.json` script `mobile:live-chart-snapshot-seed`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-chart-snapshot-seeding.test.ts src/__tests__/public.market-chart.no-leak.test.ts src/__tests__/sports.event-market-model.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run smoke:tablet:live-detail`

Unresolved P0 gaps: 0 for the seeding-harness increment.

Remaining P1 gaps:

- Local API and Docker were unavailable, so this cycle did not apply the seed script to the database and did not capture server-hydrated chart-source device XML.
- Real external provider ingestion is still missing.
- Chart loading/empty/error states and full orderbook depth remain open.

## Next Structural Work

The next cycle should continue PM-GAP-067 by running the new snapshot seed against an available backend and capturing server-hydrated chart proof, or by adding chart loading/error states or a fuller orderbook ladder route before opening a new feature area.

# Live Event Detail Audit

Status: Cycle BB passed selected Team Totals seeded ready-depth proof. Cycle BA passed compact line-group coverage and selected Totals seeded ready-depth proof. Cycle AZ passed selected Spread line-market seeded ready-depth proof. Cycle AY passed selected line-market depth identity proof. Cycle AX passed the compact mobile live-detail route and route-backed primary orderbook-depth tablet proof. Cycle AN passed structural live event detail UI with backend-shaped fixture data and tablet proof; Cycle AO added the real `/api/events/:slug` contract for market identity, line identity, compact depth, and optional chart/live-stat arrays. Cycle AQ sources embedded chart history from `MarketOutcomeSnapshot` rows when available and preserves depth outcome identity in mobile. Cycle AR adds the dedicated `/api/markets/:marketId/chart?range=...` route/client contract. Cycle AS wires EventDetail to consume that chart route in server mode. Cycle AT adds deterministic `MarketOutcomeSnapshot` seeding for local/server proof. Cycle AU exposes chart loading/empty/error route states in the game chart. Cycle AW seeded route-readable orderbook depth. This is still not full backend parity because real provider ingestion, richer delayed/suspended states, all-line-market liquidity, and provider-owned live stats remain open.

## Scope

- Feature: World Cup live football game detail.
- Reference device: Samsung S23 running Polymarket Android experience.
- Holiwyn proof device: Samsung tablet running Holiwyn through Expo Go.
- Cycle branch name: `mobile/cycle-AN-saved-watchlist-parity`, re-scoped honestly to live event detail after product steering changed.
- Out of scope: deposit, location verification, notifications, non-football live markets, World Cup informational ad/detail pages.

## Cycle BB Selected Team Totals Ready Depth Audit

Result: Pass for selected Team Totals seeded route-backed ready depth.

What became materially closer to Polymarket:

- Polymarket line-market families include team-specific totals. Holiwyn now attaches the backend Team Totals market to the visible game-page section and opens a selected route-backed order book.
- The Team Totals row is no longer local-only in server mode; it preserves backend market identity and route depth.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-BB-P0-01 | P0 | Backend `team_total_goals` normalizes to mobile `team-total` and keeps line/outcome identity. | Mobile adapter unit test | Pass |
| LED-BB-P0-02 | P0 | Team Totals group exposes `event-detail-open-order-book-team-total-goals` when server route provides the market. | Samsung tablet XML | Pass |
| LED-BB-P0-03 | P0 | Selected Team Totals order book opens market `408ffb79-3492-4fd0-b31b-87a26f8b9dd5` with `orderbook-source-orderbook-route orderbook-status-ready orderbook-empty-none`. | Samsung tablet XML/screenshot | Pass |
| LED-BB-P0-04 | P0 | Visible Team Totals order book shows seeded bid/ask depth including `0.59 USDT`, `0.65 USDT`, `1.06k shares`, and `940 shares`. | Samsung tablet XML/screenshot | Pass |
| LED-BB-P1-01 | P1 | Halves selected books and provider freshness/stale/suspended states are supported. | Future provider/route proof | Open |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-team-totals-orderbook-depth-seed.json`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-team-totals-line-groups.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-team-totals-order-book.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-team-totals-order-book.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-team-totals-order-book`

Unresolved P0 gaps: 0 for this selected Team Totals depth scope.

Remaining P1/P2 gaps:

- Provider/liquidity ingestion for all line-market groups.
- Selected Halves route-backed ready-depth proof if supported by reference/backend market catalog.
- Provider freshness, stale, suspended, and delayed states per selected line market.

## Cycle BA Compact Line Group Coverage And Totals Ready Depth Audit

Result: Pass for compact route representative line groups and selected Totals seeded route-backed ready depth.

What became materially closer to Polymarket:

- Polymarket live game pages expose multiple line-market families, not only Spread. Holiwyn's compact mobile route now keeps representative markets for the line groups the game page renders.
- The Totals row now opens a selected backend Totals order book with route-backed bid/ask depth instead of being a local-only UI row.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-BA-P0-01 | P0 | Compact live-detail payload includes representative primary, Spread 1.5, Totals 2.5, and Team Total 1.5 markets when present. | Route probe and unit test | Pass |
| LED-BA-P0-02 | P0 | Mobile Totals UI maps to backend `total_goals` market identity. | Mobile typecheck and tablet XML | Pass |
| LED-BA-P0-03 | P0 | Totals line group exposes `event-detail-open-order-book-totals` on the live game page. | Samsung tablet XML | Pass |
| LED-BA-P0-04 | P0 | Selected Totals order book opens market `a552efe6-3147-4573-be95-8fe15c068c08` with `orderbook-source-orderbook-route orderbook-status-ready orderbook-empty-none`. | Samsung tablet XML/screenshot | Pass |
| LED-BA-P0-05 | P0 | Visible Totals order book shows seeded bid/ask depth including `0.59 USDT`, `0.65 USDT`, `1.06k shares`, and `940 shares`. | Samsung tablet XML/screenshot | Pass |
| LED-BA-P1-01 | P1 | Team Totals and Halves selected books have provider-backed or continuously seeded ready depth. | Team Totals passed in Cycle BB; Halves/provider proof remains future work | Partial |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-totals-orderbook-depth-seed.json`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-totals-line-groups.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-totals-order-book.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-totals-order-book.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-totals-order-book`

Unresolved P0 gaps: 0 for this compact route and selected Totals depth scope.

Remaining P1/P2 gaps:

- Provider/liquidity ingestion for all line-market groups.
- Selected Team Totals/Halves route-backed ready-depth proof.
- Provider freshness, stale, suspended, and delayed states per selected line market.

## Cycle AZ Selected Spread Line Ready Depth Audit

Result: Pass for selected Spread line-market seeded route-backed ready depth.

What became materially closer to Polymarket:

- Polymarket line-market order books show concrete bid/ask depth for the selected market. Holiwyn now proves that behavior for a selected Spread line using backend-shaped `Order` rows and the public orderbook route.
- The selected Spread book no longer stops at a truthful empty state from Cycle AY; it now reaches `ready` with concrete price and share rows while preserving the selected market id.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-AZ-P0-01 | P0 | Seed harness can target the selected Spread market by backend-shaped `marketType=spread` and `line=1.5`. | Seed summary artifact | Pass |
| LED-AZ-P0-02 | P0 | `/api/orderbook/:marketId/book?maxLevels=24` returns ready depth for Spread market `ac527022-07f3-4abb-90f0-b291466e8459`. | Tablet smoke XML plus backend route tests | Pass |
| LED-AZ-P0-03 | P0 | EventDetail order-book overlay labels the selected Spread market id and route-backed ready state. | Tablet smoke XML | Pass |
| LED-AZ-P0-04 | P0 | The visible order book shows bid/ask prices and share sizes from the route, including `0.59 USDT`, `0.65 USDT`, `1.06k shares`, and `940 shares`. | Tablet smoke XML/screenshot | Pass |
| LED-AZ-P1-01 | P1 | All Spread/Totals/Team Totals/Halves line markets have provider-backed or continuously seeded live depth. | Future provider/route proof | Open |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-spread-orderbook-depth-seed.json`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-spread-order-book.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-spread-order-book.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-line-order-book`

Unresolved P0 gaps: 0 for this selected Spread line seeded-depth scope.

Remaining P1/P2 gaps:

- Real provider/liquidity ingestion for every line market group.
- Provider freshness, stale, suspended, and delayed states per selected line market.
- A production batching/prefetch strategy if selected-market depth route fan-out becomes too slow.

## Cycle AY Selected Line Market Depth Audit

Result: Pass for selected line-market orderbook identity and backend empty-state proof.

What became materially closer to Polymarket:

- Polymarket order books belong to the market/line the user is viewing. Holiwyn now tracks and proves the selected market id for non-primary line-market order books.
- Opening the Spread book no longer reuses the primary winner market's route-backed depth. It calls the backend book route for the selected Spread market and shows the truthful `No depth` state when that line has no liquidity.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-AY-P0-01 | P0 | Event/orderbook state records the market id whose depth was requested. | Unit test and XML label | Pass |
| LED-AY-P0-02 | P0 | EventDetail can open a backend-backed Spread market order book from the live game page. | Tablet smoke XML/screenshot | Pass |
| LED-AY-P0-03 | P0 | Spread order-book overlay labels the selected spread market id, not the primary market id. | Tablet smoke XML | Pass |
| LED-AY-P0-04 | P0 | Backend empty depth for the selected Spread market is shown as `orderbook-source-orderbook-route orderbook-status-empty orderbook-empty-no-depth`. | Tablet smoke XML | Pass |
| LED-AY-P1-01 | P1 | Spread/totals/team-total line markets have seeded or provider-backed live liquidity and show `ready` depth. | Future route/device proof | Open |

Holiwyn evidence:

- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-spread-order-book.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-spread-order-book.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-line-order-book`

Unresolved P0 gaps: 0 for this selected-market depth identity scope.

Remaining P1/P2 gaps:

- Seed/provider-backed liquidity for line markets so Spread/Totals order books show real levels rather than empty state.
- Provider freshness/stale/suspended states per selected line market.

## Cycle AX Compact Route Audit

Result: Pass for PM-GAP-067 compact mobile live-detail route and route-backed primary orderbook proof.

What became materially closer to Polymarket:

- The live football game page no longer depends on a heavy full-event payload or fallback-only depth for proof.
- Holiwyn now has a compact mobile route that delivers live game context, market groups, chart snapshots, and route-backed primary orderbook depth in the shape the app consumes.
- Samsung tablet proof opens the backend live game, opens the route-backed order book, taps Buy, and proves the ticket carries the selected backend outcome.

Acceptance criteria:

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LED-AX-P0-01 | P0 | `/api/mobile/events/:slug/live-detail` returns a mobile-sized payload with stable event, market, outcome, line, chart, depth, and contract fields. | HTTP route proof and backend unit test | Pass |
| LED-AX-P0-02 | P0 | Mobile `getEvent()` uses the compact route first and preserves legacy fallback. | Mobile API unit test | Pass |
| LED-AX-P0-03 | P0 | Tablet can deep-link into a backend live event without being reset back to Home. | Tablet smoke XML/screenshot | Pass |
| LED-AX-P0-04 | P0 | EventDetail order book displays route-backed depth state and primary best bid/ask/depth rows. | Tablet smoke XML/screenshot | Pass |
| LED-AX-P0-05 | P0 | Tapping Buy from the route-backed order book opens a ticket preserving market and selected outcome identity. | Tablet smoke XML/screenshot | Pass |
| LED-AX-P1-01 | P1 | Real provider live stats, stale/suspended states, and event-wide depth are backed by durable provider routes/schema. | Backend contract audit | Open |

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-mobile-live-detail-compact-route.json`
- `docs/mobile/screenshots/cycle-current-holiwyn-event-detail.png`
- `docs/mobile/harness/cycle-current-holiwyn-event-detail.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-server-live-order-book-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-server-live-order-book-ticket.xml`
- Proof command: `cmd /c npm.cmd run smoke:tablet:server-live-order-book`

Unresolved P0 gaps: 0 for this compact route/depth proof scope.

Remaining P1/P2 gaps:

- Real provider ingestion for live football stats and chart snapshots.
- Event-wide or on-demand route-backed depth for every compact market group.
- Richer delayed, suspended, stale, and unavailable market states.

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
| LED-P1-01 | P1 | Backend routes should provide live market groups, line options, chart history, orderbook depth, live stats, and selected identity. | Route/schema audit | Partial: `/api/events/:slug` now provides market/line/outcome identity, compact depth, snapshot-backed chart history when `MarketOutcomeSnapshot` rows exist, and optional live-stat arrays; `/api/markets/:marketId/chart?range=...` now provides a dedicated range-aware chart contract; EventDetail consumes that route in server mode; deterministic local snapshot seeding exists; chart route loading/empty/error states are visible; real provider ingestion, server-hydrated device proof, richer delayed/suspended states, and full depth routes remain open. |
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

## Cycle AU Live Chart Route State Audit

Result: Partial pass for PM-GAP-067 chart lifecycle state handling.

What became materially closer to Polymarket:

- Polymarket does not hide market data availability. Holiwyn now exposes whether the live chart is loading, route-backed, empty, or unavailable instead of silently masking backend state with a generic fallback chart.
- The chart route contract fields `range`, `lastUpdated`, and `emptyState` are now preserved into EventDetail state and XML-auditable labels.

Evidence:

- `mobile/src/services/marketChartService.ts`
- `mobile/src/components/EventDetail.tsx`
- `mobile/App.tsx`
- `mobile/src/__tests__/marketChartService.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:live-detail`
- `docs/mobile/harness/cycle-current-holiwyn-live-detail-top.xml`

Unresolved P0 gaps: 0 for the chart lifecycle-state increment.

Remaining P1 gaps:

- Backend health was unavailable, so server-hydrated `ready` proof remains open.
- Real external provider ingestion is still missing.
- Richer delayed/suspended/stale route states and full orderbook depth remain open.

## Cycle AV Live Orderbook Depth Contract Audit

Result: Partial pass for PM-GAP-067 orderbook/depth route contract and mobile EventDetail integration.

What became materially closer to Polymarket:

- Polymarket live game pages treat market depth as data-backed market infrastructure, not arbitrary local display rows. Holiwyn now has a public `/api/orderbook/:marketId/book` mobile contract with `levels[]`, `generatedAt`, `emptyState`, and compatibility `bids[]`/`asks[]`.
- EventDetail now attempts route-backed depth hydration in server mode and labels the orderbook overlay with `orderbook-source-*`, `orderbook-status-*`, and `orderbook-empty-*`, making future Audit Gate proof capable of distinguishing true backend depth from fixture fallback.
- The orderbook overlay still preserves selected outcome identity into the ticket from the Buy action.

Acceptance criteria:

| Criterion ID | Priority | Status | Verification |
| --- | --- | --- | --- |
| LD-AV-P1-01 | P1 | Pass | Public route test proves mobile `levels[]`, `generatedAt`, `emptyState`, `maxLevels` clamping, and no protected-field leak. |
| LD-AV-P1-02 | P1 | Pass | Mobile API/service tests prove `getOrderbook()` and `marketDepthService` apply ready, empty, loading, and error states. |
| LD-AV-P1-03 | P1 | Pass | Tablet orderbook smoke proves overlay source/status labels and Buy-ticket carry-through. |
| LD-AV-P1-04 | P1 | Partial | Backend health unavailable, so tablet XML captured fallback depth rather than route-backed `ready` data. |

Evidence:

- `src/app/api/orderbook/[marketId]/book/route.ts`
- `src/__tests__/public.orderbook-book.no-leak.test.ts`
- `mobile/src/services/marketDepthService.ts`
- `mobile/src/__tests__/marketDepthService.test.ts`
- `mobile/src/api.ts`
- `mobile/src/types.ts`
- `mobile/App.tsx`
- `mobile/src/components/EventDetail.tsx`
- `cmd /c npm.cmd run test:ci -- src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/sports.event-market-model.test.ts`
- `cmd /c npm.cmd run test:mobile-api -- mobile/src/__tests__/marketDepthService.test.ts mobile/src/__tests__/marketChartService.test.ts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/api.test.ts`
- `cmd /c npm.cmd run typecheck` in `mobile/`
- `cmd /c npm.cmd run build`
- `cmd /c npm.cmd run smoke:tablet:live-detail`
- `cmd /c npm.cmd run smoke:tablet:event-detail-order-book`
- `docs/mobile/harness/cycle-current-holiwyn-order-book.xml`
- `docs/mobile/harness/cycle-current-holiwyn-order-book-ticket.xml`

Unresolved P0 gaps: 0 for this backend/mobile contract increment.

Remaining P1 gaps:

- Capture server-hydrated device proof showing `orderbook-source-orderbook-route` and `orderbook-status-ready`.
- Populate real or seeded orderbook depth for live soccer markets.
- Add richer delayed/stale/suspended depth states if the provider route cannot supply fresh data.
- Ensure route-backed depth identity flows through ticket, order, portfolio, and history in a full server proof.

## Cycle AW Route-Backed Live Depth Seed Harness Audit

Result: Partial pass for PM-GAP-067 seeded live orderbook depth readiness.

What became materially closer to Polymarket:

- Polymarket live event depth is backed by real market liquidity. Holiwyn now has deterministic backend proof liquidity in the same `Order` table read by the public orderbook route, instead of relying only on mobile fixture rows.
- The seeded World Cup match orderbook route now returns bid/ask `levels[]` with stable market/outcome IDs, so the UI has a backend-shaped source it can hydrate from once the mobile event-detail payload path is optimized.

Acceptance criteria:

| Criterion ID | Priority | Status | Verification |
| --- | --- | --- | --- |
| LD-AW-P1-01 | P1 | Pass | `mobile:live-orderbook-depth-seed` created 12 open proof orders for `aca976d2-2bad-416c-b010-c874c0ee493f`. |
| LD-AW-P1-02 | P1 | Pass | Direct public orderbook route probe returned `emptyState: null` and 12 route-shaped `levels[]` rows. |
| LD-AW-P1-03 | P1 | Pass | Tablet orderbook regression proof passed with backend health OK. |
| LD-AW-P1-04 | P1 | Partial | Tablet proof still shows fallback depth; chart route timed out during direct probe. |

Evidence:

- `src/server/services/mobileLiveOrderbookDepthSeeding.ts`
- `scripts/seed_mobile_live_orderbook_depth.ts`
- `src/__tests__/mobile-live-orderbook-depth-seeding.test.ts`
- `docs/mobile/harness/cycle-current-mobile-live-chart-snapshot-seed.json`
- `docs/mobile/harness/cycle-current-mobile-live-orderbook-depth-seed.json`
- `docs/mobile/harness/cycle-current-holiwyn-order-book.xml`
- `docs/mobile/harness/cycle-current-holiwyn-order-book-ticket.xml`
- `cmd /c npm.cmd run test:ci -- src/__tests__/mobile-live-orderbook-depth-seeding.test.ts src/__tests__/public.orderbook-book.no-leak.test.ts src/__tests__/mobile-live-chart-snapshot-seeding.test.ts`
- `cmd /c npm.cmd run mobile:live-chart-snapshot-seed`
- `cmd /c npm.cmd run mobile:live-orderbook-depth-seed`
- `cmd /c npm.cmd run smoke:tablet:event-detail-order-book`

Unresolved P0 gaps: 0 for this seed harness cycle.

Remaining P1 gaps:

- Mobile server-mode proof must show `orderbook-source-orderbook-route` and `orderbook-status-ready`.
- Add or use a compact mobile live detail endpoint so the tablet does not rely on a huge 37-market event payload.
- Fix or replace the chart route proof path that timed out during this cycle.
- Replace deterministic seeded orders with real provider/liquidity ingestion before production parity.

## Next Structural Work

The next cycle should continue PM-GAP-067 by adding a compact mobile live detail/depth/chart endpoint or proof harness that lets the Samsung tablet capture route-backed chart/depth status without waiting on the full 37-market event payload.

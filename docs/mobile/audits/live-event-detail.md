# Live Event Detail Audit

Status: Cycle AQ backend contract in progress. Cycle AN passed structural live event detail UI with backend-shaped fixture data and tablet proof; Cycle AO added the real `/api/events/:slug` contract for market identity, line identity, compact depth, and optional chart/live-stat arrays. Cycle AQ now sources chart history from `MarketOutcomeSnapshot` rows when available and preserves depth outcome identity in mobile. This is still not full backend parity because provider ingestion and full history/depth routes remain open.

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
| LED-P1-01 | P1 | Backend routes should provide live market groups, line options, chart history, orderbook depth, live stats, and selected identity. | Route/schema audit | Partial: `/api/events/:slug` now provides market/line/outcome identity, compact depth, snapshot-backed chart history when `MarketOutcomeSnapshot` rows exist, and optional live-stat arrays; real provider ingestion and full depth/history routes remain open. |
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

## Next Structural Work

The next cycle should continue PM-GAP-067 with provider-shaped live data seeding/ingestion, a dedicated history route, or a fuller orderbook ladder route before opening a new feature area.

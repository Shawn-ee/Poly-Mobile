# Cycle EP - Local MVP Trading Flow Gate

Date: 2026-07-04

## Product Steering

Orderbook is no longer a primary user-facing feature for the current local MVP. It remains internal/debug infrastructure and regression support.

Default Holiwyn mobile flow should be:

1. Open app on Android.
2. Discover/open a Polymarket-backed World Cup event.
3. Review event detail, chart/probability, and line selectors.
4. Select a market/line/outcome.
5. Open the simple Trade ticket.
6. Enter amount and submit a fake-token buy/sell.
7. Confirm Portfolio positions/open orders/activity/history update with the selected market/outcome/line identity.

## P0 Criteria

- Default event detail does not expose visible Book/orderbook entry points.
- Orderbook overlay cannot open unless `EXPO_PUBLIC_SHOW_ORDERBOOK=1`.
- Event detail keeps visible chart/probability and line/outcome controls.
- Chart rail opens the simple Trade ticket by default.
- Line/outcome rows open a simple ticket preserving market id, outcome id, line, period, side, and provider identity when available.
- Ticket uses current probability/top price and does not require the orderbook ladder.
- Fake-token order placement creates visible Portfolio/open order/activity state.
- Loading/stale/unavailable route states are visible without sending the user to Book.
- Android proof covers the full user journey without relying on visible Book controls.

## P1/P2

- P1: prove both Buy and Sell in the simple ticket path.
- P1: prove spreads, totals, and team totals when provider-backed data exists.
- P1: keep orderbook regression tests behind debug/internal harnesses.
- P2: polish ticket density and event detail visual hierarchy.

## Current Result

Pass for the selected Android Buy journey.

Evidence:

- `docs/mobile/harness/cycle-EP-local-mvp-trade-flow/cycle-EP-local-mvp-trade-flow-proof.json`
- `docs/mobile/screenshots/cycle-EP-local-mvp-trade-flow/cycle-EP-holiwyn-local-mvp-market-lines.png`
- `docs/mobile/screenshots/cycle-EP-local-mvp-trade-flow/cycle-EP-holiwyn-local-mvp-selected-line.png`
- `docs/mobile/screenshots/cycle-EP-local-mvp-trade-flow/cycle-EP-holiwyn-local-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-EP-local-mvp-trade-flow/cycle-EP-holiwyn-local-mvp-portfolio.png`

Audit notes:

- Default proof ran with `orderbookDebug=unset`.
- Holiwyn hid visible Book/orderbook entry points on the selected market-line/ticket path.
- The proof selected Spread `2.5`, `1st Half`, outcome `Yes - MEX -2.5 1H`, entered `$25`, submitted fake-token Buy, and verified Portfolio/latest order/activity/position state.

Remaining P1:

- Sell-side simple-ticket proof.
- Provider-backed spread/totals/team-total breadth when data exists.
- Loading/stale/unavailable states that do not route users into Book.

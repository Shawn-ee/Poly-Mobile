# Mobile API Contracts

The app can run in mock mode without a backend. Server mode expects a Holiwyn backend reachable from the Android device.

## Environment

- `EXPO_PUBLIC_API_BASE_URL`: backend base URL.
- `EXPO_PUBLIC_API_KEY`: bearer token used by server order and Portfolio routes.
- `EXPO_PUBLIC_ORDER_MODE=server`: submit fake-token orders to the backend.
- `EXPO_PUBLIC_MARKET_DATA_MODE=server`: load market/event data from the backend.

## Routes Used By The App

| Feature | Method/Route | Auth | Mobile usage |
| --- | --- | --- | --- |
| Home/event discovery | `GET /api/mobile/events` or equivalent mobile event summary route | Optional | Populate World Cup Home cards, outcomes, volume/liquidity, source/status. |
| Event detail | `GET /api/mobile/events/:slug/live-detail` | Optional | Load Event Detail, chart/probability state, market groups, outcomes, provider/source fields. |
| Order submit | `POST /api/orders` | Required in server mode | Submit fake-token Buy/Sell orders with selected market/outcome identity. |
| Orders | `GET /api/orders` | Required in server mode | Read open orders for Portfolio. |
| Order cancel | `DELETE /api/orders/:id` | Required in server mode | Cancel open fake-token orders. |
| Portfolio | `GET /api/portfolio` | Required in server mode | Read positions, open orders, latest order, recent activity. |
| Portfolio history | `GET /api/portfolio/history` | Required in server mode | Read filled/canceled/closed activity history. |
| Portfolio value history | `GET /api/portfolio/value-history?range=1D\|1W\|1M\|All` | Required in server mode when implemented | Read account value chart points for Portfolio range selector. |
| Account/balance | `GET /api/account/balance` | Required in server mode | Read fake-token balance when server mode is enabled. |

## Selection Identity

Ticket and Portfolio flows should preserve:

- `marketId`
- `outcomeId`
- `marketType`
- `marketGroupId`
- `line`
- `period`
- `side`
- `contractSide`
- `displayLabel`
- `referenceSource`
- `externalSlug`
- `externalMarketId`
- `conditionId`
- `referenceTokenId`
- `referenceOutcomeLabel`

The mobile ticket review also derives its visible order preview from the same identity fields. `line`, `period`, `marketType`, `contractSide`, current probability/price, and selected outcome must remain stable from ticket open through `POST /api/orders`.

Local mock mode uses the same contract-shaped `selection` payload as server mode. Cycle FN proves the selected spread line identity survives `TradeTicket -> submitTicketOrder -> latestOrder -> Portfolio position/activity` without requiring backend routes.

Cycle FO changes only the ticket presentation. It does not change the order request body or route expectations; `selection`, `contractSide`, market, outcome, price, and size are still the contract fields needed by `POST /api/orders`.

Cycle FP changes only the ticket modal presentation from bottom sheet to full-screen order surface. It does not change the order request body, Portfolio handoff, or backend route expectations.

Cycle FQ changes only Portfolio presentation. The screen still consumes the same Portfolio state from local fake-token mode or server mode. A future real portfolio performance chart should add a route that returns time-series account value points for `1D`, `1W`, `1M`, and `All`; the current MVP chart is deterministic UI-only proof and does not change existing route contracts.

Cycle FR changes only the app shell render condition for Portfolio. It has no backend, API, storage, or data contract impact.

Cycle FS adds local Portfolio range state for `1D`, `1W`, `1M`, and `All`. No route changes were made. Future backend support should expose a portfolio value time-series route that accepts a range key and returns points suitable for the chart.

Cycle FT adds the mobile-side contract for that future route: `PortfolioValueHistory`, `PortfolioValueHistoryPoint`, and `PolyApi.getPortfolioValueHistory(range)`. Until the backend route exists, `Portfolio` uses deterministic fallback data with the same payload shape and exposes `source`, `status`, `range`, and point count in Android proof labels.

Cycle FU adds the main backend route for that contract: `GET /api/portfolio/value-history?range=1D|1W|1M|All`. It returns `source=portfolio-value-history-route`, `status`, timestamps, and chart points derived from `UserBalance`, `Position`, and `MarketOutcomeSnapshot`. Standalone mobile still needs a wiring/proof cycle before the Portfolio chart consumes this route in server mode.

Cycle FV wires the standalone mobile Portfolio to this route in server mode. The chart keeps deterministic fallback in mock mode or on request failure, but server-mode Android proof now expects `portfolio-chart-source-portfolio-value-history-route`.

Cycle FW makes the Portfolio chart visually consume `PortfolioValueHistory.points`. Android proof now expects `portfolio-chart-data-driven` plus a server-backed `1W` range with seven points.

Cycle FX adds a mobile-only selected chart point/readout interaction. It does not change backend contracts; the readout is derived from the same `PortfolioValueHistory.points` payload.

Cycle FY changes only Portfolio visual density. It keeps the same local/server Portfolio props, `PortfolioValueHistory` route contract, fake-token position/order/activity identity fields, and Deposit/Withdraw placeholder policy. No backend, route, schema, or request/response changes are required.

Cycle FZ changes only the ticket submit interaction proof and visual footer. It does not change the order request body, `POST /api/orders` expectations, local mock order payload, Portfolio handoff, or any backend route/schema contract.

Cycle GA changes only bottom navigation presentation. The Portfolio tab value is derived from existing `accountPortfolioValue` state in `App.tsx`; no backend route, schema, request body, or response contract changes are required.

Cycle GB changes only Event Detail chart/ticket presentation and proof coverage. The chart point readout is derived from existing mobile chart state, and the chart Trade handoff still uses the existing `selectedChartMarket`, `selectedChartTicketOutcome`, and `selectedChartTicketSelection` payload. No backend route, schema, request body, or response contract changes are required.

Cycle GC changes only the default Event Detail visible shell by hiding non-MVP Chat, Share, Live stats, and chat preview entry points. Chart, market, ticket, order, and Portfolio data contracts are unchanged. No backend route, schema, request body, or response contract changes are required.

Cycle GD changes only Home and Live discovery presentation priority. Home and Live still use the same event discovery payloads, route-backed event card IDs, market/outcome data, and ticket handoff fields. No backend route, schema, request body, or response contract changes are required.

Cycle GE changes only Portfolio presentation. It does not change `GET /api/portfolio`, `GET /api/portfolio/value-history`, local fake-token order state, server sync state, or any order/position/activity identity fields. Deposit/Withdraw remain intentionally unimplemented and hidden from the default Local MVP Portfolio UI.

Cycle GF changes only ticket presentation and proof expectations. It does not change `POST /api/orders`, local fake-token order handling, `TicketSelection`, selected line/outcome/provider identity fields, or Portfolio handoff contracts.

Cycle GG changes only game-card presentation in discovery. It does not change event discovery payloads, route-backed event IDs, market/outcome fields, `openEvent`, `openTicket`, or downstream ticket/order/Portfolio contracts.

Cycle GH changes only discovery-card rail behavior/proof and hides the old row fallback from rendering. It does not change event discovery payloads, market/outcome fields, ticket request fields, order routes, or Portfolio contracts.

Cycle GI changes only Live page presentation by hiding market/outcome summary pills from the default MVP view. It does not change live event discovery payloads, refresh behavior, market/outcome fields, ticket request fields, order routes, or Portfolio contracts.

Cycle GJ changes only Home discovery presentation by removing default Saved/watchlist controls from the Local MVP path. It does not change event discovery payloads, saved state storage, market/outcome fields, ticket request fields, order routes, or Portfolio contracts.

Cycle GK changes the mobile-side ticket handoff for Portfolio actions. No backend route changes are required. The same `POST /api/orders` contract applies when the user submits from the Buy more or Cash out ticket; the mobile payload must preserve `side`, `contractSide`, market/outcome identity, and any selection fields such as `marketType`, `line`, `period`, and `displayLabel`.

Cycle GL changes only local fake-token cash-out handling. No backend route or schema changes are required. In server mode, submitted Sell tickets still use `POST /api/orders`; true server-backed close/position netting is outside this local MVP cycle. Mobile now carries `sourcePositionId` only as local UI state so a mock cash-out sell can remove the original local position after submit.

Cycle GM changes only mobile ticket state reset behavior for Portfolio action tickets. No backend route, request body, response field, or schema changes are required. The existing `POST /api/orders` payload is unchanged after the user enters an amount; `sourcePositionId` remains local UI state for mock cash-out handling.

Cycle GN changes only mobile Portfolio icon derivation. No backend route, request body, response field, or schema changes are required. The UI derives a team flag from existing `selection.displayLabel`, `selection.referenceOutcomeLabel`, `outcome`, and `title` fields already present in local/server Portfolio state.

Cycle GO changes only mobile ticket header icon derivation. No backend route, request body, response field, or schema changes are required. The UI derives a team flag from existing `selection.displayLabel`, `selection.referenceOutcomeLabel`, `outcome.label`, event title, and market label fields already present in the ticket state.

Cycle GP changes only mobile Portfolio History presentation and local activity creation. No backend route, request body, response field, or schema changes are required. Locally submitted fake-token trades set `PortfolioActivity.timestamp` to `t.justNow`, and the History row renders that field next to the amount. Server-backed history still consumes backend-provided activity timestamps.

Cycle GQ changes only mobile Event Detail presentation. No backend route, request body, response field, or schema changes are required. Existing chart/provider status fields remain available as accessibility/proof metadata, while visible retail UI uses the existing selected contract, current probability, and ticket handoff state.

Cycle GR changes only mobile Event Detail presentation. No backend route, request body, response field, or schema changes are required. Market availability/status fields remain in accessibility/proof metadata and are no longer displayed as prominent default market-header pills.

Cycle GS changes only mobile Event Detail presentation. No backend route, request body, response field, or schema changes are required. The line-card Graph/About action strip is UI-only and continues to use existing market/outcome data.

Cycle GT changes only mobile ticket layout presentation on wide Android screens. No backend route, request body, response field, or schema changes are required. The same ticket state, `TicketSelection` identity fields, local fake-token submit path, and server-mode `POST /api/orders` expectations remain unchanged.

Cycle GU changes only mobile Portfolio layout presentation on wide Android screens. No backend route, request body, response field, or schema changes are required. Portfolio continues to consume the same balance, positions, open orders, activities, value history, and ticket handoff fields.

Cycle GV changes only mobile Event Detail layout presentation on wide Android screens. No backend route, request body, response field, or schema changes are required. Event Detail continues to consume the same event, chart, market, outcome, line selector, ticket handoff, and order/Portfolio identity fields.

Cycle GW changes only mobile Home layout presentation on wide Android screens. No backend route, request body, response field, or schema changes are required. Home continues to consume the same event discovery data, event card handoff, ticket, order, and Portfolio identity fields.

Cycle GX changes only mobile ticket presentation and proof gates. No backend route, request body, response field, or schema changes are required. Ticket submit continues to use the same fake-token/server-backed order contract, and hidden proof identity continues to carry market, line, period, provider token, side, payout, and Portfolio handoff fields.

Cycle GY changes only the mobile Portfolio bottom-tab label presentation and proof gate. No backend route, request body, response field, or schema changes are required. The tab value continues to derive from existing local/server Portfolio value state.

Cycle GZ changes only mobile Event Detail presentation and proof gates. No backend route, request body, response field, or schema changes are required. Event volume/liquidity fields remain available in existing summary/proof metadata, but default visible Event Detail now keeps that data out of the retail betting surface.

Cycle HA changes only mobile Event Detail chart label presentation and proof gates. No backend route, request body, response field, or schema changes are required. Existing chart history, selected outcome, selected market, selected line, and ticket handoff contracts remain unchanged.

Cycle HB changes only mobile Portfolio chart rendering and proof gates. No backend route, request body, response field, or schema changes are required. `Portfolio` continues to consume the same `PortfolioValueHistory` fields: `range`, `ranges`, `source`, `status`, `points`, `generatedAt`, `lastUpdated`, and `emptyState`; deterministic fallback data remains backend-shaped until the real persisted value-history route is available.

Cycle HC changes only mobile Event Detail card presentation and proof gates. No backend route, request body, response field, or schema changes are required. Existing event, market, outcome, line, period, selected contract, and ticket handoff contracts remain unchanged.

Cycle HD changes only mobile Home discovery presentation and proof gates. No backend route, request body, response field, or schema changes are required. Home continues to consume the same game `events` array, market/outcome identity fields, `openEvent`, and `openTicket` handoff contracts; the default Local MVP path no longer exposes the `futures` list branch.

Cycle HE changes only mobile live Event Detail presentation and proof gates. No backend route, request body, response field, or schema changes are required. Live `liveDataStatus`, provider lifecycle, and source fields remain available in hidden proof/accessibility metadata; they are no longer rendered as visible operational freshness copy in the default Local MVP game page.

Cycle HF changes only the mobile ticket submit interaction and proof gate. No backend route, request body, response field, or schema changes are required. The same fake-token/server-backed order path is used after the upward swipe; `TicketSelection`, selected line/outcome/provider identity, amount, side, and Portfolio handoff contracts are unchanged.

Cycle HG changes only visible mobile Event Detail copy. No backend route, request body, response field, or schema changes are required. Event, market, outcome, chart, provider, and ticket handoff contracts are unchanged.

Cycle HH changes only visible mobile Live discovery presentation and proof gates. No backend route, request body, response field, or schema changes are required. Live events still consume the same `events`, `markets`, `outcomes`, `refreshTick`, and `isRefreshing` props; refresh/count state is now hidden structured metadata in the default Local MVP UI.

Cycle HI changes only visible mobile Event Detail presentation and proof gates. No backend route, request body, response field, or schema changes are required. The server-backed proof still uses `POST /api/orders`, `GET /api/portfolio`, and `GET /api/portfolio/value-history` through an in-process mobile dev credential. The submitted ticket preserves `marketType`, `line`, `period`, `contractSide`, `referenceSource`, provider market/condition/token IDs, and selected outcome metadata. The harness now asserts durable route-backed markers such as `chart-source-polymarket-clob-prices-history`, `chart-status-ready`, `portfolio-chart-source-portfolio-value-history-route`, `portfolio-provider-source-polymarket`, and `portfolio-provider-token-*` instead of stale visible sync labels.

Cycle HJ changes only mobile Portfolio tab landing behavior and proof gates. No backend route, request body, response field, or schema changes are required. Mobile continues to consume `POST /api/orders`, `GET /api/portfolio`, and `GET /api/portfolio/value-history`. When the Portfolio snapshot returns an open order and no filled position for the latest submitted ticket, the UI selects the Orders tab so the existing `openOrders[]` response is visible to the user. Filled position snapshots still land on Positions.

Cycle HK changes only mobile Portfolio open-order row presentation and proof gates. No backend route, request body, response field, or schema changes are required. Mobile still consumes the same `openOrders[]` fields from `GET /api/portfolio`: order ID, title, outcome, selection/provider identity, side, status, price, remaining size, value, and placed time. The visible row is simplified for the retail MVP while hidden proof labels continue to preserve order-time provider/line identity.

Cycle HL changes only the mobile server-filled proof gate. No backend route, request body, response field, or schema changes are required. The route-backed filled flow still uses `POST /api/orders`, `GET /api/portfolio`, `GET /api/portfolio/history`, and `GET /api/portfolio/value-history`; the proof now requires that Portfolio History exposes the filled activity row with the same `marketType`, `line`, `period`, provider source, and provider token identity consumed by the mobile app.

Cycle HM changes only mobile ticket presentation, the ticket settings toggle, and proof gates. No backend route, request body, response field, or schema changes are required. The ticket continues to consume existing event, market, outcome, balance, provider identity, selected line, selected period, price/probability, and server order fields. The settings panel displays values already present in the ticket state: order type, odds, and available balance.

Cycle HN changes only mobile Portfolio post-order scroll/landing behavior and proof gates. No backend route, request body, response field, or schema changes are required. Mobile still consumes `POST /api/orders`, `GET /api/portfolio`, `GET /api/portfolio/history`, and `GET /api/portfolio/value-history`; the new landing behavior uses the existing `latestOrder`, `positions[]`, `openOrders[]`, and `activities[]` state already returned or derived by the current Portfolio flow.

Cycle HO changes only mobile Portfolio position-row layout and proof marker placement. No backend route, request body, response field, or schema changes are required. Mobile continues to consume the same position fields from `GET /api/portfolio` and the same value-history fields from `GET /api/portfolio/value-history`; the row-level route proof mirrors existing `displayedValueHistory.source` and `displayedValueHistory.status` so result-scrolled screenshots can still verify chart/value data state.

Cycle HP changes only mobile Event Detail header formatting and proof recovery. No backend route, request body, response field, or schema changes are required. Mobile continues to consume the existing event fields: `teams[]`, `status`, `startsAt`, outcomes/probabilities, chart metadata, line-market identity, and provider source/token fields. The header derives display codes and a live clock label from those existing fields.

Cycle HQ changes only mobile Event Detail lower-page presentation and proof scanning. No backend route, request body, response field, or schema changes are required. Mobile continues to consume the same event, market, outcome, line, period, provider source/token, chart metadata, order, and portfolio contracts. Removed lower-page `Market Rules` / `More Events` content was static frontend-only display copy and not backed by a mobile API contract.

Cycle HS changes only mobile Trade Ticket presentation, preset amounts, swipe progress feedback, and proof gates. No backend route, request body, response field, or schema changes are required. Ticket submit continues to use the same `POST /api/orders` path and preserves the same selected event, market, outcome, line, period, provider source/token, side, amount, and payout fields.

Cycle HT changes only mobile Portfolio History row presentation and proof gates. No backend route, request body, response field, or schema changes are required. Mobile continues to consume the same `GET /api/portfolio` / history activity fields: title, outcome, selection, contract side, amount, probability, timestamp, provider source/token, market type, line, and period.

Cycle HU changes only mobile Event Detail chart/probability presentation and proof gates. No backend route, request body, response field, or schema changes are required. Mobile continues to consume existing event fields, chart history/status/source fields, provider source/token identity, market type, line, period, outcome probability, and the existing `POST /api/orders` / Portfolio routes used by the Local MVP flow. The visible UI hides default order-book and live-stat-like chart clutter while preserving backend-shaped chart/ticket metadata in accessibility proof labels.

Cycle HV changes only mobile Portfolio Positions row presentation and proof gates. No backend route, request body, response field, or schema changes are required. Mobile continues to consume the same `GET /api/portfolio` position fields: title, outcome, selection, contract side, amount, probability/current price, current value, PnL, live state, live clock, provider source/token, market type, line, and period.

Cycle HW changes only mobile Event Detail tab proof and Player Props empty-state metadata. No backend route, request body, response field, or schema changes are required. Player Props remains intentionally unavailable for the current soccer MVP and does not call order, portfolio, market, or provider routes.

Cycle HX changes only mobile Trade Ticket header presentation and proof gates. No backend route, request body, response field, or schema changes are required. Mobile continues to consume the same ticket event, teams, market, outcome, selected line, selected period, provider source/token, amount, side, and server order fields.

Cycle HY changes only mobile Trade Ticket amount-entry presentation, fixed swipe-zone layout, and proof gates. No backend route, request body, response field, or schema changes are required. Mobile continues to submit the same amount, side, contract side, market/outcome identity, line, period, provider source/token, and payout context through the existing server-backed fake-token order flow.

Cycle HZ changes only mobile proof liquidity setup and Portfolio amount assertions. No backend route, request body, response field, or schema changes are required. The existing `POST /api/orders` request still sends price and share size derived from the ticket amount, and `GET /api/portfolio` still returns filled position `costBasisTokens`, `valueTokens`, shares, average cost, current price, and provider/line identity. The proof now seeds enough deterministic asks for the `$75` ticket to fully fill, so the Portfolio row's `costBasisTokens` matches the submitted ticket amount.

Cycle IA changes mobile Portfolio History aggregation for recent trade fills. No backend route or schema changed in this cycle. Mobile still consumes `GET /api/portfolio/history` fields: recent trade ID, market/outcome identity, selection/provider identity, side, shares, cost, fee, and created time. The desired route contract now includes optional `recentTrades[].orderId` or `recentTrades[].executionGroupId` so mobile can group multi-fill orders by durable backend identity. Until that route exists, mobile groups same-selection fills inside a short execution window and marks the visible row with `fillCount`.

Cycle IB changes only mobile Portfolio header/chart/range spacing and proof coverage. No backend route, request body, response field, or schema changes are required. Mobile continues to consume the same `GET /api/portfolio` balance/positions/orders data and `GET /api/portfolio/value-history` range, source, status, points, and generated/updated fields. Funding remains hidden in the Local MVP route.

Cycle IC changes only Event Detail default market-group expansion and visible subtitle separators. No backend route, request body, response field, or schema changes are required. Mobile continues to consume the same event markets/outcomes, line-market fields, provider source/token identity, and `POST /api/orders` ticket handoff contract.

## Provider Data

For Polymarket-backed markets, mobile expects backend-shaped data to include:

- `source` / `referenceSource`
- provider slug/market/condition/token IDs
- best bid / best ask / spread when available
- chart history or explicit chart status
- loading/stale/unavailable status when provider data is not ready

Order book depth can exist in the backend, but it should not be shown in the default Local MVP mobile UI.

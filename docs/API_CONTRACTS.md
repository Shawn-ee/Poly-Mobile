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

## Provider Data

For Polymarket-backed markets, mobile expects backend-shaped data to include:

- `source` / `referenceSource`
- provider slug/market/condition/token IDs
- best bid / best ask / spread when available
- chart history or explicit chart status
- loading/stale/unavailable status when provider data is not ready

Order book depth can exist in the backend, but it should not be shown in the default Local MVP mobile UI.

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

## Provider Data

For Polymarket-backed markets, mobile expects backend-shaped data to include:

- `source` / `referenceSource`
- provider slug/market/condition/token IDs
- best bid / best ask / spread when available
- chart history or explicit chart status
- loading/stale/unavailable status when provider data is not ready

Order book depth can exist in the backend, but it should not be shown in the default Local MVP mobile UI.

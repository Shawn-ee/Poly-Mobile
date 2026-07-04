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

## Provider Data

For Polymarket-backed markets, mobile expects backend-shaped data to include:

- `source` / `referenceSource`
- provider slug/market/condition/token IDs
- best bid / best ask / spread when available
- chart history or explicit chart status
- loading/stale/unavailable status when provider data is not ready

Order book depth can exist in the backend, but it should not be shown in the default Local MVP mobile UI.

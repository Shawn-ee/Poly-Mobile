# Agent API

Authoritative note:
- The bot-facing contract should now be read from [AGENT_API_V2.md](/C:/Users/hecto/Desktop/projects/Poly/docs/AGENT_API_V2.md).
- This file is retained for continuity, but `AGENT_API_V2.md` is the authoritative reference for autonomous trading agents.

This document describes the current agent-facing API in this repository as implemented today.

It is written for autonomous trading agents and operator teams. It distinguishes:
- canonical bot routes
- public market discovery routes that bots may use
- legacy/UI routes that bots should not use

All examples are illustrative but based on the real route handlers and shared helpers in this repo.

## Contract Status

### Canonical bot contract

These are the supported machine-oriented routes:
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `DELETE /api/orders/:id`
- `GET /api/fills`
- `GET /api/account/balance`
- `GET /api/account/positions`
- `GET /api/account/ledger`
- `GET /api/markets/:id/quote`
- `GET /api/stream/me/orders`

### Public market discovery routes

These are available and useful to bots, but they predate the canonical layer:
- `GET /api/markets`
- `GET /api/markets/:id`
- `GET /api/stream/market/:marketId`

Current caveat:
- public discovery routes do not use the canonical error envelope everywhere
- some market price fields on these older routes are numeric, not string-serialized

### Do not use for bots

Do not build new bots against the legacy/UI routes listed in `LEGACY_ROUTES.md`.

## Authentication

### API key format

Canonical protected routes support API key auth with:

```http
Authorization: Bearer <keyId>.<secret>
```

Example:

```http
Authorization: Bearer pk_live_abc123.def456
```

### Supported scopes

Supported API key scopes:
- `orders:read`
- `orders:write`
- `fills:read`
- `account:read`
- `account:write`
- `markets:read`

Current route usage:
- `POST /api/orders` -> `orders:write`
- `GET /api/orders` -> `orders:read`
- `GET /api/orders/:id` -> `orders:read`
- `DELETE /api/orders/:id` -> `orders:write`
- `GET /api/fills` -> `fills:read`
- `GET /api/account/balance` -> `account:read`
- `GET /api/account/positions` -> `account:read`
- `GET /api/account/ledger` -> `account:read`
- `GET /api/profile/preferences` -> `account:read`
- `PUT /api/profile/preferences` -> `account:write`
- `GET /api/stream/me/orders` -> `orders:read` and `fills:read`

### Session fallback

Canonical protected routes accept either:
- a valid API key, or
- an existing browser session cookie

Precedence:
- if an `Authorization: Bearer ...` header is present, API key auth is attempted first
- if API key auth succeeds, it is used
- if the bearer token is invalid/revoked/insufficient, the request fails
- the presence of an invalid bearer token does not fall back to session auth
- session auth is used only when no bearer token is present

### Secret handling

API key secrets are shown only once at creation time.

The server stores only a salted hash and never returns the raw secret again.

## Error Envelope

Canonical bot routes return machine-readable errors in this format:

```json
{
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Common canonical error codes include:
- `UNAUTHORIZED`
- `INVALID_API_KEY`
- `API_KEY_REVOKED`
- `API_KEY_DISABLED`
- `API_KEY_READ_ONLY`
- `INSUFFICIENT_SCOPE`
- `INVALID_REQUEST`
- `INVALID_ORDER_TYPE`
- `MARKET_ORDER_NOT_SUPPORTED`
- `IDEMPOTENCY_KEY_REQUIRED_FOR_RETRYABLE_CLIENTS`
- `IDEMPOTENCY_KEY_CONFLICT`
- `IDEMPOTENCY_REQUEST_IN_PROGRESS`
- `DUPLICATE_CLIENT_ORDER_ID`
- `INSUFFICIENT_BALANCE`
- `ORDER_NOT_FOUND`
- `FORBIDDEN`
- `RATE_LIMIT_EXCEEDED`

## Idempotency

`POST /api/orders` supports durable idempotency through:
- `Idempotency-Key` request header
- `clientOrderId` request body field

Precedence:
- `Idempotency-Key` header wins if both are present
- otherwise `clientOrderId` is used as the idempotency key

Behavior:
- same key + same normalized payload -> original stored success/failure response is replayed
- same key + different payload -> `409 IDEMPOTENCY_KEY_CONFLICT`
- same `clientOrderId` + different payload -> `409 DUPLICATE_CLIENT_ORDER_ID`
- concurrent identical submissions are safe; only one order request record should win, and the loser resolves by re-reading the stored request

In-progress behavior:
- the server polls the stored `ApiOrderRequest` for completion
- current implementation polls up to about 3 seconds total
- if still processing, it returns:

```json
{
  "error": {
    "code": "IDEMPOTENCY_REQUEST_IN_PROGRESS",
    "message": "Order request with this idempotency key is still processing. Retry shortly."
  }
}
```

## Route Reference

## `GET /api/markets`

- Purpose: list public markets for discovery
- Auth: none
- Query params:
  - `category`
  - `tags` comma-separated
  - `search`
  - `status`
  - `view` (`resolved`, `all`, default live-only)
- Response: `{ "markets": [...] }`

Example request:

```http
GET /api/markets?search=election&view=all
```

Example response:

```json
{
  "markets": [
    {
      "id": "mkt_1",
      "title": "Example market",
      "description": "Example",
      "status": "LIVE",
      "resolveTime": "2026-03-20T12:00:00.000Z",
      "createdAt": "2026-03-15T12:00:00.000Z",
      "outcomes": [
        { "id": "out_yes", "name": "YES" },
        { "id": "out_no", "name": "NO" }
      ],
      "type": "BINARY",
      "kind": "ORDERBOOK",
      "visibility": "PUBLIC",
      "mechanism": "ORDERBOOK",
      "category": { "id": "cat_1", "name": "Politics", "slug": "politics" },
      "tags": [{ "id": "tag_1", "name": "US", "slug": "us", "group": "region" }],
      "prices": { "YES": 0.5, "NO": 0.5 },
      "pricesByOutcome": { "out_yes": 0.5, "out_no": 0.5 }
    }
  ]
}
```

Common errors:
- not consistently canonical

Bot guidance:
- safe for discovery
- price fields here are currently numeric, not string-serialized
- use `GET /api/markets/:id/quote` for canonical quote values

## `GET /api/markets/:id`

- Purpose: public market detail
- Auth: none for public markets; visibility rules are enforced
- Response: `{ "market": { ... } }`

Example request:

```http
GET /api/markets/mkt_1
```

Example response:

```json
{
  "market": {
    "id": "mkt_1",
    "title": "Example market",
    "description": "Example",
    "status": "LIVE",
    "kind": "ORDERBOOK",
    "visibility": "PUBLIC",
    "mechanism": "ORDERBOOK",
    "ownerId": null,
    "isCanceled": false,
    "betCloseTime": null,
    "isListed": true,
    "resolveTime": "2026-03-20T12:00:00.000Z",
    "createdAt": "2026-03-15T12:00:00.000Z",
    "outcomes": [
      { "id": "out_yes", "name": "YES" },
      { "id": "out_no", "name": "NO" }
    ],
    "type": "BINARY",
    "category": { "id": "cat_1", "name": "Politics", "slug": "politics" },
    "tags": [],
    "prices": { "YES": 0.5, "NO": 0.5 },
    "pricesByOutcome": { "out_yes": 0.5, "out_no": 0.5 }
  }
}
```

Common errors:
- `404` market not found
- visibility/permission failures are not uniformly canonical on this older route

Bot guidance:
- safe for discovery
- like `/api/markets`, price fields are currently numeric

## `GET /api/markets/:id/quote`

- Purpose: canonical quote endpoint for orderbook markets
- Auth: none for public markets; visibility rules still apply
- Query params:
  - `outcomeId` optional
- Response:
  - `marketId`
  - `quotes[]`
  - all decimal price fields serialized as strings or `null`

Example request:

```http
GET /api/markets/mkt_1/quote
```

Example response:

```json
{
  "marketId": "mkt_1",
  "quotes": [
    {
      "outcomeId": "out_yes",
      "outcomeName": "YES",
      "bestBid": "0.43",
      "bestAsk": "0.44",
      "midPrice": "0.435",
      "lastPrice": "0.44",
      "lastTradeAt": "2026-03-15T12:01:00.000Z"
    }
  ]
}
```

Common errors:
- `INVALID_REQUEST`
- `FORBIDDEN`
- `NOT_FOUND`

Bot guidance:
- prefer this route over older `prices` fields from `/api/markets` and `/api/markets/:id`
- currently supports `ORDERBOOK` markets only

## `POST /api/orders`

- Purpose: submit a canonical order
- Auth: API key or session
- Scope: `orders:write`
- Supported order types:
  - `LIMIT`
- Not supported:
  - `MARKET`

Request body:

```json
{
  "marketId": "mkt_1",
  "outcomeId": "out_yes",
  "side": "BUY",
  "type": "LIMIT",
  "price": "0.45",
  "size": "25.000000",
  "clientOrderId": "optional-client-id"
}
```

Example request:

```http
POST /api/orders
Authorization: Bearer pk_live_abc123.def456
Idempotency-Key: order-001
Content-Type: application/json
```

```json
{
  "marketId": "mkt_1",
  "outcomeId": "out_yes",
  "side": "BUY",
  "type": "LIMIT",
  "price": "0.45",
  "size": "25.000000",
  "clientOrderId": "order-001"
}
```

Example success response:

```json
{
  "order": {
    "id": "ord_1",
    "marketId": "mkt_1",
    "outcomeId": "out_yes",
    "side": "BUY",
    "type": "LIMIT",
    "clientOrderId": "order-001",
    "apiKeyId": "pk_live_abc123",
    "price": "0.45",
    "size": "25.000000",
    "remaining": "25.000000",
    "reservedNotional": "11.250000",
    "status": "OPEN"
  },
  "fills": [],
  "balance": {
    "availableUSDC": "88.750000",
    "lockedUSDC": "11.250000"
  },
  "position": null
}
```

Common error codes:
- `IDEMPOTENCY_KEY_REQUIRED_FOR_RETRYABLE_CLIENTS`
- `INVALID_REQUEST`
- `INVALID_ORDER_TYPE`
- `MARKET_ORDER_NOT_SUPPORTED`
- `INSUFFICIENT_BALANCE`
- `IDEMPOTENCY_KEY_CONFLICT`
- `DUPLICATE_CLIENT_ORDER_ID`
- `IDEMPOTENCY_REQUEST_IN_PROGRESS`
- `ORDER_SIZE_LIMIT_EXCEEDED`
- `ORDER_NOTIONAL_LIMIT_EXCEEDED`
- `OPEN_ORDER_LIMIT_EXCEEDED`
- `DAILY_NOTIONAL_LIMIT_EXCEEDED`
- `API_KEY_DISABLED`
- `API_KEY_READ_ONLY`
- `INSUFFICIENT_SCOPE`
- `RATE_LIMIT_EXCEEDED`

Bot guidance:
- always send `Idempotency-Key` or `clientOrderId`
- do not send market orders yet
- all monetary and price fields are string-serialized

## `GET /api/orders`

- Purpose: list the authenticated actor’s orders
- Auth: API key or session
- Scope: `orders:read`
- Query params:
  - `marketId`
  - `status` comma-separated from `OPEN,PARTIAL,FILLED,CANCELED`
  - `cursor`
  - `limit` default `50`, max `100`

Example request:

```http
GET /api/orders?marketId=mkt_1&status=OPEN,PARTIAL&limit=20
Authorization: Bearer pk_live_abc123.def456
```

Example response:

```json
{
  "items": [
    {
      "id": "ord_1",
      "clientOrderId": "order-001",
      "marketId": "mkt_1",
      "marketTitle": "Example market",
      "outcomeId": "out_yes",
      "outcomeName": "YES",
      "side": "BUY",
      "type": "LIMIT",
      "status": "OPEN",
      "apiKeyId": "pk_live_abc123",
      "canceledByApiKeyId": null,
      "price": "0.45",
      "size": "25.000000",
      "remaining": "25.000000",
      "reservedNotional": "11.250000",
      "createdAt": "2026-03-15T12:00:00.000Z",
      "updatedAt": "2026-03-15T12:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

Common error codes:
- `INVALID_REQUEST`
- `UNAUTHORIZED`
- `INSUFFICIENT_SCOPE`
- `RATE_LIMIT_EXCEEDED`

Bot guidance:
- use cursor pagination, not page numbers
- returned order values are string-safe decimals

## `GET /api/orders/:id`

- Purpose: get one order plus its fills
- Auth: API key or session
- Scope: `orders:read`

Example request:

```http
GET /api/orders/ord_1
Authorization: Bearer pk_live_abc123.def456
```

Example response:

```json
{
  "order": {
    "id": "ord_1",
    "clientOrderId": "order-001",
    "marketId": "mkt_1",
    "marketTitle": "Example market",
    "outcomeId": "out_yes",
    "outcomeName": "YES",
    "side": "BUY",
    "type": "LIMIT",
    "status": "OPEN",
    "apiKeyId": "pk_live_abc123",
    "canceledByApiKeyId": null,
    "price": "0.45",
    "size": "25.000000",
    "remaining": "25.000000",
    "reservedNotional": "11.250000",
    "createdAt": "2026-03-15T12:00:00.000Z",
    "updatedAt": "2026-03-15T12:00:00.000Z"
  },
  "fills": [
    {
      "id": "fill_1",
      "orderId": "ord_1",
      "marketId": "mkt_1",
      "outcomeId": "out_yes",
      "side": "BUY",
      "liquidityRole": "TAKER",
      "price": "0.45",
      "size": "5.000000",
      "notionalUSDC": "2.250000",
      "feeUSDC": "0.000000",
      "createdAt": "2026-03-15T12:00:01.000Z"
    }
  ]
}
```

Common error codes:
- `ORDER_NOT_FOUND`
- `UNAUTHORIZED`
- `INSUFFICIENT_SCOPE`

Bot guidance:
- use this for authoritative order status
- fill side/liquidity role is normalized from the requesting user’s perspective

## `DELETE /api/orders/:id`

- Purpose: cancel one of the authenticated actor’s own orderbook orders
- Auth: API key or session
- Scope: `orders:write`

Example request:

```http
DELETE /api/orders/ord_1
Authorization: Bearer pk_live_abc123.def456
```

Example response:

```json
{
  "order": {
    "id": "ord_1",
    "marketId": "mkt_1",
    "outcomeId": "out_yes",
    "side": "BUY",
    "type": "LIMIT",
    "clientOrderId": "order-001",
    "apiKeyId": "pk_live_abc123",
    "canceledByApiKeyId": "pk_live_abc123",
    "price": "0.45",
    "size": "25.000000",
    "remaining": "25.000000",
    "reservedNotional": "0",
    "status": "CANCELED"
  },
  "balance": {
    "availableUSDC": "100.000000",
    "lockedUSDC": "0"
  },
  "position": null
}
```

Common error codes:
- `ORDER_NOT_FOUND`
- `FORBIDDEN`
- `CONFLICT`
- `UNAUTHORIZED`
- `INSUFFICIENT_SCOPE`

Bot guidance:
- only public live orderbook orders can be canceled here
- canceled balance/position updates are returned inline

## `GET /api/fills`

- Purpose: list the authenticated actor’s fills
- Auth: API key or session
- Scope: `fills:read`
- Query params:
  - `marketId`
  - `cursor`
  - `limit` default `50`, max `100`

Example response:

```json
{
  "items": [
    {
      "id": "fill_1",
      "orderId": "ord_1",
      "marketId": "mkt_1",
      "outcomeId": "out_yes",
      "side": "BUY",
      "liquidityRole": "TAKER",
      "price": "0.45",
      "size": "5.000000",
      "notionalUSDC": "2.250000",
      "feeUSDC": "0.000000",
      "createdAt": "2026-03-15T12:00:01.000Z"
    }
  ],
  "nextCursor": null
}
```

Common error codes:
- `INVALID_REQUEST`
- `UNAUTHORIZED`
- `INSUFFICIENT_SCOPE`

Bot guidance:
- use this for user fill history
- side and liquidity role are normalized to the authenticated user

## `GET /api/account/balance`

- Purpose: canonical custody balance summary
- Auth: API key or session
- Scope: `account:read`

Example response:

```json
{
  "availableUSDC": "88.750000",
  "lockedUSDC": "11.250000",
  "totalUSDC": "100.000000",
  "updatedAt": "2026-03-15T12:00:00.000Z"
}
```

Bot guidance:
- balance is user-level, not API-key-level

## `GET /api/account/positions`

- Purpose: current non-zero positions
- Auth: API key or session
- Scope: `account:read`
- Query params:
  - `marketId` optional

Example response:

```json
{
  "items": [
    {
      "marketId": "mkt_1",
      "marketTitle": "Example market",
      "marketStatus": "LIVE",
      "outcomeId": "out_yes",
      "outcomeName": "YES",
      "shares": "10.000000",
      "reservedShares": "0",
      "avgCost": "0.45",
      "realizedPnl": "0",
      "updatedAt": "2026-03-15T12:05:00.000Z"
    }
  ]
}
```

Bot guidance:
- positions are user-level, not isolated per API key
- current implementation only returns rows with non-zero `shares`

## `GET /api/account/ledger`

- Purpose: account ledger history
- Auth: API key or session
- Scope: `account:read`
- Query params:
  - `cursor`
  - `limit` default `50`, max `100`

Example response:

```json
{
  "items": [
    {
      "id": "led_1",
      "operation": "LOCK",
      "reason": "LOCK",
      "currency": "GAME_TOKEN",
      "amountDelta": "0",
      "deltaAvailableUSDC": "-11.250000",
      "deltaLockedUSDC": "11.250000",
      "referenceType": "ORDER",
      "referenceId": "ord_1",
      "txHash": null,
      "chainId": null,
      "logIndex": null,
      "tokenAddress": null,
      "createdAt": "2026-03-15T12:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

Bot guidance:
- use this for auditable cash movement history
- values are string-safe decimals

## `GET /api/stream/market/:marketId`

- Purpose: SSE market stream for quotes/trades/top-of-book snapshot updates
- Auth: none
- Query params:
  - `outcomeId` optional
- Transport: Server-Sent Events

Current event types:
- `quote.snapshot`
- `quote.updated`

Canonical SSE envelope:

```json
{
  "id": "123",
  "sequence": "123",
  "type": "quote.updated",
  "ts": "2026-03-15T12:00:00.000Z",
  "stream": "market",
  "marketId": "mkt_1",
  "outcomeId": "out_yes",
  "userId": null,
  "payload": {
    "topLevels": {
      "bids": [{ "outcomeId": "out_yes", "price": "0.43", "size": "10.000000" }],
      "asks": [{ "outcomeId": "out_yes", "price": "0.44", "size": "7.000000" }]
    },
    "recentTrades": []
  }
}
```

Replay:
- clients may reconnect with `Last-Event-ID`
- the server replays persisted events where `id > Last-Event-ID`
- when no `Last-Event-ID` is provided, the server sends a non-persisted bootstrap snapshot first

Bot guidance:
- treat this as at-least-once delivery
- persist your last processed event ID and reconnect with `Last-Event-ID`

## `GET /api/stream/me/orders`

- Purpose: SSE account stream for balance/open-order/fill updates
- Auth: API key or session
- Scope: `orders:read` and `fills:read`
- Query params:
  - `marketId` optional

Current event types:
- `account.snapshot`
- `account.updated`

Example envelope:

```json
{
  "id": "456",
  "sequence": "456",
  "type": "account.updated",
  "ts": "2026-03-15T12:00:01.000Z",
  "stream": "account",
  "marketId": "mkt_1",
  "outcomeId": null,
  "userId": "usr_1",
  "payload": {
    "balance": {
      "availableUSDC": "88.750000",
      "lockedUSDC": "11.250000",
      "totalUSDC": "100.000000"
    },
    "orders": [],
    "fills": []
  }
}
```

Replay:
- reconnect with `Last-Event-ID`
- replay returns persisted events with `id > Last-Event-ID`
- when no `Last-Event-ID` is provided, a non-persisted bootstrap snapshot is sent first

Bot guidance:
- delivery is at-least-once, not exactly-once
- account events are user-level, not API-key-isolated

## Stream Caveats

Current stream limitations:
- durable replay comes from persisted `CanonicalEvent`
- live delivery is still SSE over HTTP
- there is no exactly-once guarantee
- bootstrap snapshot events are not part of durable replay history
- replay is bounded server-side

Correctness model:
- persist the last processed event ID
- reconnect with `Last-Event-ID`
- make downstream processing idempotent

## Legacy Routes Bots Should Not Use

Do not use these older routes for new bot integrations:
- `POST /api/orderbook/place`
- `POST /api/orderbook/cancel`
- `GET /api/orderbook/:marketId/orders`
- `POST /api/orderbook/:marketId/orders/place`
- `POST /api/orderbook/:marketId/orders/cancel`
- `GET /api/wallet/balance`
- `GET /api/portfolio`

Preferred replacements:
- `POST /api/orders`
- `DELETE /api/orders/:id`
- `GET /api/orders?marketId=...`
- `GET /api/account/balance`
- `GET /api/account/positions`
- `GET /api/account/ledger`
- canonical SSE routes under `/api/stream/**`

## Current Limitations

- market orders are not supported yet
- `POST /api/orders` accepts `type: "MARKET"` only to return `MARKET_ORDER_NOT_SUPPORTED`
- public discovery routes `/api/markets` and `/api/markets/:id` still expose numeric price fields
- balances and positions are user-level, not isolated per API key
- account stream activity is user-level
- streams are durable for replay but still SSE-based and at-least-once
- legacy UI/orderbook routes remain in the codebase and are not a stable agent contract

## Bot Usage Recommendations

- use canonical account/order/fill routes only
- use `/api/markets/:id/quote` for machine-readable quote values
- always send `Idempotency-Key` or `clientOrderId` on `POST /api/orders`
- persist `Last-Event-ID` for both SSE streams
- treat stream processing and order submission handling as idempotent
- expect string decimals on canonical routes
- do not parse legacy numeric `prices` fields as if they were canonical money fields

## Update Notes

This document should be updated when any of the following change:
- market order support is added
- canonical market discovery routes replace `/api/markets` and `/api/markets/:id`
- new SSE event types are added
- per-key account isolation is introduced
- settlement/payout streams are introduced

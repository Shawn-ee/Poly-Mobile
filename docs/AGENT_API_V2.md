# Agent API v2

## Purpose

This document is the authoritative bot-facing API contract for autonomous trading agents in this repository.

It covers the current canonical API surface as implemented today. It does not describe every route in the app. Bots should use only the canonical routes documented here.

## Contract Status

This is the current supported bot contract for:
- canonical order submission and cancellation
- canonical order, fill, balance, position, and ledger reads
- canonical quote reads
- canonical market/account streams

This contract is additive on top of an older application surface. Some older discovery routes remain useful, but they are not the canonical machine-trading contract.

## Out of Scope for Bots

The bot contract does not include these route families:
- `/api/pool-markets/**`
- `/api/private-pools/**`
- `/api/admin/**`
- legacy UI/orderbook/account routes listed in [LEGACY_ROUTES.md](/C:/Users/hecto/Desktop/projects/Poly/LEGACY_ROUTES.md)

In particular, bots should not trade against:
- `POST /api/orderbook/place`
- `POST /api/orderbook/cancel`
- `POST /api/orderbook/:marketId/orders/place`
- `POST /api/orderbook/:marketId/orders/cancel`
- `GET /api/orderbook/:marketId/orders`
- `GET /api/wallet/balance`
- `GET /api/portfolio`

## Authentication

Protected canonical routes support either:
- API key auth
- browser session auth

Bots should use API keys.

### API Key Format

Send:

```http
Authorization: Bearer <keyId>.<secret>
```

Example:

```http
Authorization: Bearer pk_live_example.s3cr3t
```

Secrets are shown in full only once at creation time. The server stores only a salted hash and never returns the raw secret again.

### Session And API Key Precedence

If both a session and `Authorization: Bearer ...` are present:
- API key auth is attempted first
- if the bearer token is valid, the request uses that API credential
- if the bearer token is invalid, revoked, disabled, or missing required scopes, the request fails
- an invalid bearer token does not fall back to session auth

## Scope Model

Supported scopes:
- `orders:read`
- `orders:write`
- `fills:read`
- `account:read`
- `account:write`
- `markets:read`

### Scope Semantics

There are two possible scope rules in principle:
- `requires both`: the request must have every listed scope
- `requires either`: the request may have any one of a listed set

Current canonical implementation uses `requires both` semantics whenever multiple scopes are listed. It does not implement an `either scope` rule today.

That means:
- `GET /api/stream/me/orders` requires both `orders:read` and `fills:read`

It is not enough to have only one of those scopes.

### Route Scope Map

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

## Canonical Data Encoding

On canonical bot routes:
- all prices, balances, sizes, notionals, and other monetary quantities are decimal strings
- all timestamps are ISO-8601 UTC strings
- bots must not assume floating-point safety

Examples:
- `"0.45"`
- `"25.000000"`
- `"2026-03-15T12:00:00.000Z"`

Important caveat:
- older discovery routes such as `GET /api/markets` and `GET /api/markets/:id` still expose some price fields as JSON numbers, not decimal strings

## Error Envelope

Canonical bot routes return errors in this shape:

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
- `ORDER_SIZE_LIMIT_EXCEEDED`
- `ORDER_NOTIONAL_LIMIT_EXCEEDED`
- `OPEN_ORDER_LIMIT_EXCEEDED`
- `DAILY_NOTIONAL_LIMIT_EXCEEDED`

Public discovery routes are older and do not always use the canonical error envelope.

## Idempotency

`POST /api/orders` supports durable idempotency.

### Inputs

The request may provide:
- `Idempotency-Key` request header
- `clientOrderId` in the JSON body

### Precedence

If both are present:
- `Idempotency-Key` is the idempotency key
- `clientOrderId` is still stored when applicable, but it does not override the header

If the header is absent:
- `clientOrderId` is used as the idempotency key

### Behavior

Same key plus same normalized payload:
- the original stored result is replayed
- no second order is created

Same key plus different normalized payload:
- the server returns `409 IDEMPOTENCY_KEY_CONFLICT`

Concurrent identical submissions:
- only one request record should win
- a concurrent loser resolves by re-reading the stored request record
- it replays the stored response when the fingerprint matches

### In-Progress Behavior

If an idempotent request record already exists and is still processing:
- the server polls briefly for completion
- current implementation waits for about 3 seconds total
- if still incomplete, it returns:

```json
{
  "error": {
    "code": "IDEMPOTENCY_REQUEST_IN_PROGRESS",
    "message": "Order request with this idempotency key is still processing. Retry shortly."
  }
}
```

## Route Reference

### `GET /api/markets`

- Purpose: public market discovery
- Auth: none
- Canonical status: useful for discovery, not the canonical machine-trading contract

Query parameters:
- `category`
- `tags`
- `search`
- `status`
- `view`

Example:

```http
GET /api/markets?search=election&view=all
```

Response shape:

```json
{
  "markets": [
    {
      "id": "mkt_1",
      "title": "Example market",
      "status": "LIVE",
      "mechanism": "ORDERBOOK",
      "visibility": "PUBLIC",
      "outcomes": [
        { "id": "out_yes", "name": "YES" },
        { "id": "out_no", "name": "NO" }
      ],
      "prices": { "YES": 0.5, "NO": 0.5 },
      "pricesByOutcome": { "out_yes": 0.5, "out_no": 0.5 }
    }
  ]
}
```

Common errors:
- non-uniform on this older route

Bot guidance:
- use for discovery only
- some price fields may still be numeric
- do not treat this route as the canonical trading-price contract
- use `GET /api/markets/:id/quote` for canonical quote values

### `GET /api/markets/:id`

- Purpose: public market detail
- Auth: anonymous for public markets; visibility rules still apply
- Canonical status: useful for discovery, not the canonical machine-trading contract

Example:

```http
GET /api/markets/mkt_1
```

Response shape:

```json
{
  "market": {
    "id": "mkt_1",
    "title": "Example market",
    "status": "LIVE",
    "mechanism": "ORDERBOOK",
    "visibility": "PUBLIC",
    "ownerId": "usr_owner_or_null",
    "outcomes": [
      { "id": "out_yes", "name": "YES" },
      { "id": "out_no", "name": "NO" }
    ],
    "prices": { "YES": 0.5, "NO": 0.5 },
    "pricesByOutcome": { "out_yes": 0.5, "out_no": 0.5 }
  }
}
```

Common errors:
- `404` if the market does not exist
- older non-canonical visibility error behavior may apply

Bot guidance:
- use for discovery and metadata only
- `ownerId` here is market ownership, not order ownership
- price fields may still be numeric
- use `GET /api/markets/:id/quote` for canonical trading quotes

### `GET /api/markets/:id/quote`

- Purpose: canonical quote endpoint
- Auth: anonymous for public markets; visibility rules apply
- Canonical status: canonical for machine-readable quote data

Query parameters:
- `outcomeId` optional

Example:

```http
GET /api/markets/mkt_1/quote
```

Filtered example:

```http
GET /api/markets/mkt_1/quote?outcomeId=out_yes
```

Response shape:

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

Quote semantics:
- the response always contains a `quotes` array
- without `outcomeId`, the array contains all active outcomes for the market
- with `outcomeId`, the array contains only that outcome if found
- missing book sides are returned as `null`
- `midPrice` is `null` if neither side exists, otherwise bid, ask, or midpoint as available
- quote ordering follows outcome display order ascending, then outcome creation order ascending
- this route supports `ORDERBOOK` markets only

Common errors:
- `INVALID_REQUEST`
- `FORBIDDEN`
- `NOT_FOUND`

Bot guidance:
- use this route for canonical trading quotes
- do not infer a canonical quote contract from older `prices` fields on discovery routes

### `POST /api/orders`

- Purpose: submit a canonical order
- Auth: API key or session
- Scope: `orders:write`

Supported order types:
- `LIMIT`

Not supported:
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

Example:

```http
POST /api/orders
Authorization: Bearer pk_live_example.s3cr3t
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
    "apiKeyId": "pk_live_example",
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
- `INVALID_REQUEST`
- `INVALID_ORDER_TYPE`
- `MARKET_ORDER_NOT_SUPPORTED`
- `IDEMPOTENCY_KEY_CONFLICT`
- `DUPLICATE_CLIENT_ORDER_ID`
- `IDEMPOTENCY_REQUEST_IN_PROGRESS`
- `INSUFFICIENT_BALANCE`
- `API_KEY_DISABLED`
- `API_KEY_READ_ONLY`
- `INSUFFICIENT_SCOPE`
- `RATE_LIMIT_EXCEEDED`
- `ORDER_SIZE_LIMIT_EXCEEDED`
- `ORDER_NOTIONAL_LIMIT_EXCEEDED`
- `OPEN_ORDER_LIMIT_EXCEEDED`
- `DAILY_NOTIONAL_LIMIT_EXCEEDED`

Bot guidance:
- always send `Idempotency-Key` or `clientOrderId`
- treat retries as normal behavior
- do not send `MARKET` orders yet
- all monetary and price fields are decimal strings

### `GET /api/orders`

- Purpose: list the authenticated actor's orders
- Auth: API key or session
- Scope: `orders:read`

Query parameters:
- `marketId` optional
- `status` optional comma-separated list from `OPEN,PARTIAL,FILLED,CANCELED`
- `cursor` optional
- `limit` optional, default `50`, max `100`

Example:

```http
GET /api/orders?marketId=mkt_1&status=OPEN,PARTIAL&limit=20
Authorization: Bearer pk_live_example.s3cr3t
```

Response shape:

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
      "apiKeyId": "pk_live_example",
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
- treat the route as newest-first
- use `GET /api/orders/:id` for an authoritative single-order read

### `GET /api/orders/:id`

- Purpose: fetch one order and its fills
- Auth: API key or session
- Scope: `orders:read`

Example:

```http
GET /api/orders/ord_1
Authorization: Bearer pk_live_example.s3cr3t
```

Response shape:

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
    "apiKeyId": "pk_live_example",
    "canceledByApiKeyId": null,
    "price": "0.45",
    "size": "25.000000",
    "remaining": "25.000000",
    "reservedNotional": "11.250000",
    "createdAt": "2026-03-15T12:00:00.000Z",
    "updatedAt": "2026-03-15T12:00:00.000Z"
  },
  "fills": []
}
```

Common error codes:
- `ORDER_NOT_FOUND`
- `UNAUTHORIZED`
- `INSUFFICIENT_SCOPE`

Bot guidance:
- use this route for authoritative order lookup
- fill `side` and `liquidityRole` are normalized from the caller's perspective

### `DELETE /api/orders/:id`

- Purpose: cancel one of the caller's own orderbook orders
- Auth: API key or session
- Scope: `orders:write`

Example:

```http
DELETE /api/orders/ord_1
Authorization: Bearer pk_live_example.s3cr3t
```

Response shape:

```json
{
  "order": {
    "id": "ord_1",
    "marketId": "mkt_1",
    "outcomeId": "out_yes",
    "side": "BUY",
    "type": "LIMIT",
    "clientOrderId": "order-001",
    "apiKeyId": "pk_live_example",
    "canceledByApiKeyId": "pk_live_example",
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
- `API_KEY_DISABLED`
- `API_KEY_READ_ONLY`
- `RATE_LIMIT_EXCEEDED`

Bot guidance:
- only your own live orderbook orders can be canceled here
- the response includes inline balance and position updates

### `GET /api/fills`

- Purpose: list the caller's fills
- Auth: API key or session
- Scope: `fills:read`

Query parameters:
- `marketId` optional
- `cursor` optional
- `limit` optional, default `50`, max `100`

Response shape:

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
- `RATE_LIMIT_EXCEEDED`

Bot guidance:
- use this for fill history
- fill `side` and `liquidityRole` are normalized from the caller's perspective

### `GET /api/account/balance`

- Purpose: canonical custody balance summary
- Auth: API key or session
- Scope: `account:read`

Response shape:

```json
{
  "availableUSDC": "88.750000",
  "lockedUSDC": "11.250000",
  "totalUSDC": "100.000000",
  "updatedAt": "2026-03-15T12:00:00.000Z"
}
```

Bot guidance:
- this is user-level balance, not API-key-level balance

### `GET /api/account/positions`

- Purpose: current non-zero positions
- Auth: API key or session
- Scope: `account:read`

Query parameters:
- `marketId` optional

Response shape:

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
- this is user-level position state, not isolated per API key
- current implementation returns only rows where `shares` is non-zero

### `GET /api/account/ledger`

- Purpose: auditable ledger history
- Auth: API key or session
- Scope: `account:read`

Query parameters:
- `cursor` optional
- `limit` optional, default `50`, max `100`

Response shape:

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
- all monetary deltas are decimal strings

## Streams

### Event Envelope

Canonical streams emit Server-Sent Events using this envelope shape:

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
  "payload": {}
}
```

Envelope fields:
- `id`: event identifier used for SSE replay
- `sequence`: same logical sequence value as a string
- `type`: event type
- `ts`: event timestamp
- `stream`: stream family
- `marketId`: market scope when applicable
- `outcomeId`: outcome scope when applicable
- `userId`: user scope on account events
- `payload`: event body

### `GET /api/stream/market/:marketId`

- Purpose: canonical market SSE stream
- Auth: anonymous for public markets; market visibility rules apply
- Query parameters:
  - `outcomeId` optional

Current event types:
- `quote.snapshot`
- `quote.updated`

Replay semantics:
- if `Last-Event-ID` is present, replay returns persisted events with `id > Last-Event-ID`
- if `Last-Event-ID` is absent, the server sends a bootstrap snapshot event first
- bootstrap snapshot events are not part of durable replay history

Bot guidance:
- treat delivery as at-least-once
- replay may include events your consumer effectively already processed
- make downstream handling idempotent
- public order ownership is not exposed on this stream

### `GET /api/stream/me/orders`

- Purpose: canonical account SSE stream
- Auth: API key or session
- Scope: requires both `orders:read` and `fills:read`
- Query parameters:
  - `marketId` optional

Current event types:
- `account.snapshot`
- `account.updated`

Payloads may include:
- balance updates
- order updates
- fill updates

Replay semantics:
- if `Last-Event-ID` is present, replay returns persisted events with `id > Last-Event-ID`
- if `Last-Event-ID` is absent, the server sends a bootstrap snapshot event first
- bootstrap snapshot events are not part of durable replay history

Bot guidance:
- treat delivery as at-least-once, not exactly-once
- persist the last fully processed event id
- reconnect with `Last-Event-ID`
- account events are user-level, not API-key-isolated

## Visibility And Privacy Model

Bots may see:
- market metadata
- canonical quote data
- aggregate top-of-book levels
- public market state
- public trade-derived market information

Bots may not see:
- which user placed a public bid or ask
- which API key placed a public bid or ask
- another user's balances
- another user's positions
- another user's private order ownership

Important distinction:
- market ownership metadata, such as `ownerId` on a market detail route, is market ownership
- it is not order ownership
- public liquidity remains anonymous from the bot consumer's perspective

## Pagination And Ordering

### `GET /api/orders`

- sort order: newest first
- implementation order: `createdAt desc`, then `id desc`
- `nextCursor` is the last item id from the current page when more results exist

### `GET /api/fills`

- sort order: newest first
- implementation order: `createdAt desc`, then `id desc`
- `nextCursor` is the last item id from the current page when more results exist

### `GET /api/account/ledger`

- sort order: newest first
- implementation order: `createdAt desc`, then `id desc`
- `nextCursor` is the last item id from the current page when more results exist

Cursor caveat:
- cursors are id-based handles into a stable `(createdAt, id)` ordering
- if the referenced cursor row no longer resolves for that user, the route returns an invalid cursor error

## Canonical Order Statuses

The canonical order statuses currently exposed to bots are:
- `OPEN`
- `PARTIAL`
- `FILLED`
- `CANCELED`

This document does not imply any additional public status values.

## Current Limitations

- market orders are not supported yet
- `POST /api/orders` accepts `type: "MARKET"` only to return `MARKET_ORDER_NOT_SUPPORTED`
- settlement and payout APIs are not yet part of the canonical bot contract
- settlement and payout streams are not yet part of the canonical bot contract
- `GET /api/markets` and `GET /api/markets/:id` are still older discovery routes with some numeric price fields and less uniform error behavior
- balances and positions are user-level, not isolated per API key
- account streams are user-level, not isolated per API key
- stream delivery should be treated as at-least-once
- replay can appear duplicated from the client's perspective
- bootstrap snapshot events are not durable replay history

## Legacy Routes Bots Should Not Use

See [LEGACY_ROUTES.md](/C:/Users/hecto/Desktop/projects/Poly/LEGACY_ROUTES.md) for the full migration mapping.

In short, do not build new bots against:
- `/api/orderbook/**`
- `/api/wallet/balance`
- `/api/portfolio`
- `/api/pool-markets/**`
- `/api/private-pools/**`
- `/api/admin/**`

Preferred replacements:
- `/api/orders`
- `/api/orders/:id`
- `/api/fills`
- `/api/account/balance`
- `/api/account/positions`
- `/api/account/ledger`
- `/api/markets/:id/quote`
- `/api/stream/market/:marketId`
- `/api/stream/me/orders`

## Bot Usage Recommendations

- use canonical order, fill, account, quote, and stream routes only
- use `GET /api/markets` and `GET /api/markets/:id` for discovery, not as the canonical machine trading contract
- use `GET /api/markets/:id/quote` for trading quotes
- always send an `Idempotency-Key` on `POST /api/orders`
- persist the last processed SSE event id and reconnect with `Last-Event-ID`
- make order handling and stream handling idempotent on your side
- treat public liquidity as anonymous
- do not assume account state is separated per API key

## Update Notes

- This v2 document is now the authoritative bot-facing API reference in this repository.
- The older [AGENT_API.md](/C:/Users/hecto/Desktop/projects/Poly/docs/AGENT_API.md) remains for continuity, but bots should follow this document when there is any difference in phrasing or emphasis.
- Update this document when any of the following change:
  - market orders are added
  - canonical discovery routes replace the older market discovery routes
  - new canonical stream event types are added
  - settlement/payout APIs become part of the bot contract
  - account state becomes isolated per API key

# Bot E2E Test Plan

This plan validates the canonical bot API against a real Postgres database and live HTTP routes.

## Environment

- Postgres in Docker via `docker-compose.yml`
- Next.js app running locally against that database
- Canonical routes only
- API-key auth for bot scenarios

## Scenarios

### 1. Bot authentication with API key works
- Purpose: confirm canonical protected routes accept API-key auth
- Prerequisites: seeded trader bot API key and funded user
- Endpoints: `GET /api/account/balance`
- Expected result: `200` with string-safe balance fields
- DB state change: none

### 2. Read market, quote, balance, fills, positions, and ledger successfully
- Purpose: confirm a bot can discover state before trading
- Prerequisites: one live public orderbook market with seeded maker liquidity
- Endpoints:
  - `GET /api/markets`
  - `GET /api/markets/:id/quote`
  - `GET /api/account/balance`
  - `GET /api/fills`
  - `GET /api/account/positions`
  - `GET /api/account/ledger`
- Expected result: `200` responses, quote includes seeded ask, account routes require API key
- DB state change: none

### 3. Place a limit buy order successfully
- Purpose: confirm canonical order placement works through the bot API
- Prerequisites: funded trader key with `orders:write`; live market
- Endpoints:
  - `POST /api/orders`
  - `GET /api/orders/:id`
  - `GET /api/orders?marketId=...&status=OPEN`
- Expected result: `200`, order is `OPEN`, order is retrievable, balances reflect locked funds
- DB state change:
  - new `Order`
  - new `ApiOrderRequest`
  - new `LedgerEntry` lock row
  - `UserBalance` moved from available to locked
  - canonical account/market events emitted

### 4. Retry the same order idempotently and confirm no duplicate order is created
- Purpose: verify durable idempotency on canonical `POST /api/orders`
- Prerequisites: scenario 3 order already submitted
- Endpoints: `POST /api/orders` with same `Idempotency-Key` and payload
- Expected result: original order response is replayed; order count unchanged
- DB state change: no additional `Order`; existing `ApiOrderRequest` reused

### 5. Same idempotency key with different payload returns conflict
- Purpose: verify client retries cannot silently mutate an order request
- Prerequisites: valid trader key
- Endpoints: `POST /api/orders` twice with same idempotency key and different payload
- Expected result: second request returns `409` with `IDEMPOTENCY_KEY_CONFLICT`
- DB state change: first order request persists; second does not create another order

### 6. Cancel an open order successfully
- Purpose: verify canonical cancel path and fund unlocks
- Prerequisites: open order owned by trader bot
- Endpoints:
  - `DELETE /api/orders/:id`
  - `GET /api/account/balance`
- Expected result: `200`, order becomes `CANCELED`, locked funds reduce
- DB state change:
  - `Order.status = CANCELED`
  - `Order.canceledByApiCredentialId` set
  - unlock ledger entry written
  - user balance unlocked
  - canonical account/market events emitted

### 7. Scope enforcement works
- Purpose: verify a constrained key cannot trade
- Prerequisites: seeded insufficient-scope key without `orders:write`
- Endpoints: `POST /api/orders`
- Expected result: `403` with `INSUFFICIENT_SCOPE`
- DB state change: none

### 8. Risk-limit enforcement works
- Purpose: verify per-key governance blocks unsafe automation
- Prerequisites: seeded limited key with notional and open-order caps
- Endpoints: `POST /api/orders`
- Expected result:
  - oversized notional request returns `ORDER_NOTIONAL_LIMIT_EXCEEDED`
  - second open order under capped key returns `OPEN_ORDER_LIMIT_EXCEEDED`
- DB state change:
  - rejected requests write no new order
  - first allowed order persists for open-order cap check

### 9. Order attribution to API key is persisted
- Purpose: verify direct bot attribution survives beyond request logs
- Prerequisites: order created via trader API key
- Endpoints: `GET /api/orders/:id`
- Expected result: API response includes `apiKeyId`
- DB state change to verify:
  - `Order.createdApiCredentialId` matches seeded trader credential

### 10. Stream replay works with `Last-Event-ID`
- Purpose: verify basic resumable consumption for bot account streams
- Prerequisites: at least one persisted account event for the trader bot
- Endpoints: `GET /api/stream/me/orders`
- Expected result: with `Last-Event-ID` set to one less than a known event ID, stream replays that event with canonical envelope
- DB state change: none during replay itself

## Notes

- Market-order scenarios are intentionally excluded because market orders are still deferred.
- Stream coverage focuses on replay correctness, not full durability guarantees beyond the current shared event-log implementation.

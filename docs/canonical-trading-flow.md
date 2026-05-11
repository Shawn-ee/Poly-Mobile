# Canonical Trading Flow

## Canonical routes

- `POST /api/orders`
  - Creates a public orderbook limit order.
  - Requires session auth or bearer API key with `orders:write`.
  - Requires `Idempotency-Key` header or `clientOrderId`.
- `GET /api/orders`
  - Lists the caller's orders.
  - Supports `marketId`, `status`, `cursor`, `limit`.
- `GET /api/orders/:id`
  - Returns one order and its fills for the caller.
- `DELETE /api/orders/:id`
  - Cancels the caller's public orderbook order and releases remaining reservations.

## Placement flow

1. `POST /api/orders` enters [orders/route.ts](/C:/Users/hecto/Desktop/projects/PolyProj/Poly/src/app/api/orders/route.ts).
2. `runCanonicalRoute(...)` authenticates the actor and enforces canonical rate limits.
3. `submitCanonicalOrder(...)` in [canonicalOrderSubmission.ts](/C:/Users/hecto/Desktop/projects/PolyProj/Poly/src/server/services/canonicalOrderSubmission.ts) validates:
   - auth scope
   - idempotency
   - market / outcome / side / type
   - price bounds
   - size bounds
4. Valid orders call `placeOrderAndMatch(...)` in [matching.ts](/C:/Users/hecto/Desktop/projects/PolyProj/Poly/src/server/services/matching.ts).
5. The route emits:
   - `quote.updated` to the market stream
   - `account.updated` to the caller stream

## Matching flow

`placeOrderAndMatch(...)`:

- runs in a Prisma transaction
- locks balance / position / order rows
- locks opposing makers in price-time order
- matches fills at maker price
- updates maker and taker orders
- preserves binary resting-book invariants
- writes `Fill`, `Trade`, and `LedgerEntry` rows

## Cancel flow

1. `DELETE /api/orders/:id` enters [orders/[id]/route.ts](/C:/Users/hecto/Desktop/projects/PolyProj/Poly/src/app/api/orders/[id]/route.ts).
2. The route verifies ownership, public orderbook scope, and market status.
3. `cancelOrderAndUnlock(...)` in [matching.ts](/C:/Users/hecto/Desktop/projects/PolyProj/Poly/src/server/services/matching.ts):
   - marks the order `CANCELED`
   - releases remaining `reservedNotional` for BUY orders
   - releases remaining `reservedShares` for SELL orders
4. The route emits market and account updates.

## Balance reservation and release

- BUY placement:
  - decreases `UserBalance.availableUSDC`
  - increases `UserBalance.lockedUSDC`
  - stores remaining lock in `Order.reservedNotional`
- BUY fill:
  - consumes locked USDC
  - refunds price improvement if fill price is better than order price
- BUY cancel:
  - returns remaining `reservedNotional` to `availableUSDC`
  - decreases `lockedUSDC`

- SELL placement:
  - leaves USDC unchanged
  - increases `Position.reservedShares`
- SELL fill:
  - decreases `shares`
  - decreases `reservedShares`
  - credits seller proceeds less fee
- SELL cancel:
  - releases remaining `reservedShares`

## Position updates

- BUY fill:
  - increases buyer `Position.shares`
  - recalculates `avgCost`
- SELL fill:
  - decreases seller `Position.shares`
  - increases `realizedPnl`

## Ledger entries

Each fill writes ledger rows keyed to the `Fill`:

- buyer `FILL`
- seller `SELL`
- platform `FEE`

BUY order open/cancel and minting also write ledger entries for lock/unlock behavior.

## SSE updates

- Public market stream: `GET /api/stream/market/:marketId`
  - bootstrap event: `quote.snapshot`
  - live event: `quote.updated`
- User account stream: `GET /api/stream/me/orders`
  - bootstrap event: `account.snapshot`
  - live event: `account.updated`

Both streams derive payloads from [orderbookEvents.ts](/C:/Users/hecto/Desktop/projects/PolyProj/Poly/src/server/services/orderbookEvents.ts).

## Deprecated legacy routes

These still exist for compatibility, but canonical clients should not use them:

- `POST /api/orderbook/[marketId]/orders/place`
- `POST /api/orderbook/[marketId]/orders/cancel`
- `GET /api/orderbook/[marketId]/orders`
- `POST /api/orderbook/place`
- `POST /api/orderbook/cancel`

Current status:

- bots already use canonical `/api/orders`
- the frontend orderbook view has been migrated to canonical `/api/orders`
- legacy routes remain for compatibility tests and any remaining session-era clients

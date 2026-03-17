# Phase 2 Notes

## Canonical Order Idempotency

`POST /api/orders` now requires one durable external idempotency identifier:
- `Idempotency-Key` request header, or
- `clientOrderId` in the request body

Precedence rule:
- If `Idempotency-Key` is present, it is the primary idempotency key.
- If `Idempotency-Key` is absent, `clientOrderId` is used as the idempotency key.
- `clientOrderId` is also enforced as a unique per-user client order identifier when provided.

Behavior:
- Repeating the same canonical order submission with the same effective key and same normalized payload returns the stored original response.
- Reusing the same effective key with a different payload returns `IDEMPOTENCY_KEY_CONFLICT`.
- Reusing the same `clientOrderId` with a different payload returns `DUPLICATE_CLIENT_ORDER_ID`.

## Market Orders

Canonical `POST /api/orders` accepts `type: "LIMIT" | "MARKET"` at the API contract layer.

`MARKET` orders are currently deferred and return:
- `MARKET_ORDER_NOT_SUPPORTED`

Reason:
- The existing matching engine supports price-bounded limit order matching only.
- It does not yet have a native IOC / consume-only market-order path that guarantees unmatched size never rests on the book.
- Adding market orders safely should be done in the engine/service layer, not faked in the route layer.

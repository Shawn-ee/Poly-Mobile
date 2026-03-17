# Phase 6 Notes

## Stream Backend Choice

Canonical bot streams now use a shared database-backed event log:
- `CanonicalEvent`

This is the source of truth for:
- replay
- multi-instance visibility
- stable event IDs

Local in-process fanout still exists for low-latency delivery on the instance that created the event, but replay and cross-instance catch-up now come from the database.

## Event Envelope Contract

Canonical stream events now use a stable envelope:

```json
{
  "id": "123",
  "sequence": "123",
  "type": "quote.updated",
  "ts": "2026-03-15T12:00:00.000Z",
  "stream": "market",
  "marketId": "m1",
  "outcomeId": "o1",
  "userId": null,
  "payload": {}
}
```

Current canonical event types:
- `quote.updated`
- `quote.snapshot`
- `account.updated`
- `account.snapshot`

Payloads remain decimal-safe and use strings for monetary and price values.

## Replay Semantics

Canonical SSE routes:
- `GET /api/stream/market/:marketId`
- `GET /api/stream/me/orders`

Replay behavior:
- clients may reconnect with `Last-Event-ID`
- the server replays persisted events with `id > Last-Event-ID`
- replay is capped per query using the server-side replay limit
- continued polling will deliver the next batch after the last replayed event

Bootstrap behavior:
- when no `Last-Event-ID` is provided, the stream sends a non-persisted snapshot event first
- snapshot events are for convenience and are not part of durable replay history

Current durability caveat:
- event persistence is durable
- live fanout is still SSE over HTTP
- there is no exactly-once delivery guarantee
- clients should treat replay + idempotent processing as the correctness model

## Bot Client Guidance

Minimal bot helper added:
- `src/lib/botClient.ts`

It provides:
- canonical auth header construction
- typed convenience methods for quote, balance, orders, and limit-order submission
- `Idempotency-Key` forwarding for `POST /api/orders`
- simple stream connection helper

Recommended client behavior:
- always set `clientOrderId` or `Idempotency-Key` on `POST /api/orders`
- persist the last processed event ID per stream
- reconnect streams with `Last-Event-ID`
- use canonical routes only

## Rate-Limit Bucket Cleanup

Shared DB-backed fixed-window buckets still need pruning.

Added helper:
- `pruneExpiredCanonicalRateLimitBuckets()`

Current default retention:
- 48 hours

Recommended operation:
- run from a cron/scheduled job
- keep retention short because old buckets are no longer useful after enforcement windows pass

## Stronger Bot Contract Guidance

Canonical routes remain the only stable contract for bots.
Legacy UI/orderbook routes are still present for compatibility, but they are not the supported automation surface.

## Remaining Before Public Bot Access

- streaming still lacks a dedicated shared push fabric such as Redis streams/pubsub or a message bus
- replay is durable, but live push still depends on HTTP SSE connections
- market orders are still deferred
- there is still no dedicated settlement/payout event stream
- legacy routes still remain in the codebase

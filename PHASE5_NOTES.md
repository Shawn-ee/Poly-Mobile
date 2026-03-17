# Phase 5 Notes

## Shared Rate Limiting

Canonical bot rate limiting now uses a shared provider abstraction in:
- `src/server/services/canonicalRateLimit.ts`

Backend selection:
- default: database-backed fixed-window buckets
- optional local fallback: `CANONICAL_RATE_LIMIT_BACKEND=memory`

Database backend:
- stores per-key, per-route, per-window counters in `ApiCredentialRateLimitBucket`
- is safe across multiple app instances sharing the same database
- keeps the same `RATE_LIMIT_EXCEEDED` machine-readable error contract

Memory backend:
- remains available for local development and tests
- is not multi-instance safe

Operational note:
- the current shared backend uses fixed windows, not sliding windows
- old rate-limit bucket rows are not pruned yet

## Attribution Changes

Order attribution is now direct on `Order`:
- `createdApiCredentialId`
- `canceledByApiCredentialId`

This means bot-created orders can be traced without joining only through `ApiOrderRequest`.

Canonical order responses now surface:
- `apiKeyId`
- `canceledByApiKeyId`

Session-authenticated UI activity keeps these fields `null`.

## Stream Hardening First Step

This phase does not make SSE durable across instances.

Implemented safe additive improvements:
- SSE events now emit stable `id:` values using the existing in-process sequence number
- market stream now sends proper SSE event framing with `id` and `event`
- user order stream now also supports replay from `Last-Event-ID` against in-memory history

Important caveat:
- replay remains process-local only
- if the process restarts or traffic is routed to another instance, replay history is lost
- this should not be treated as durable delivery

Recommended next streaming architecture:
- persist canonical market/account events to a shared event log or Redis stream
- issue monotonically increasing per-stream cursors from that shared source
- serve replay from the shared store, not memory

## Tests Added

Focused Phase 5 tests cover:
- two simultaneous identical canonical order submissions -> one order created
- same idempotency key with different payload -> conflict
- API key disabled/read-only enforcement
- per-key max order size enforcement
- shared database-backed rate limiting across provider instances
- canonical route scope enforcement for orders/account routes

## Remaining Before Public Bot Access

- shared durable streaming is still missing
- market orders remain deferred
- there is still no explicit bot webhook/account-event stream
- legacy UI routes still exist and remain non-canonical
- rate-limit bucket cleanup/background pruning is still absent

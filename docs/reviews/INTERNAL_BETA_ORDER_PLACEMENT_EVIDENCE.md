# Internal Beta Order Placement Evidence

Date: 2026-06-24

## Summary

Phase F adds guarded internal beta access controls in front of the existing real order placement path.

Chosen model:

```text
Option B: Existing matched order path, gated for internal beta only
```

Reason:

- The repo already has `Order`, `Fill`, `Trade`, `Position`, `UserBalance`, `LedgerEntry`, and `ApiOrderRequest` models.
- `POST /api/orders` already uses `submitCanonicalOrder`.
- `submitCanonicalOrder` already validates idempotency and calls `placeOrderAndMatch`.
- `placeOrderAndMatch` already reserves buyer funds, persists orders, can match/fill, updates positions, and writes ledger entries.
- Existing tests cover canonical idempotency, API key policy, orderbook event emission, order ticket payloads, and deeper matching/settlement behavior outside `test:ci`.

This phase does not create a new matching engine or settlement path.

## What Changed

Added server-side internal trading beta flags:

- `INTERNAL_TRADING_BETA_ENABLED`
- `INTERNAL_TRADING_ALLOWLIST_EMAILS`
- `TRADING_KILL_SWITCH`

Safe defaults:

- internal trading beta disabled
- trading kill switch enabled
- no users allowlisted unless explicitly configured

Added guard helper:

```text
src/lib/internalTradingBeta.ts
```

Guard behavior:

- anonymous user blocked by existing auth route behavior
- beta disabled blocked with `TRADING_BETA_DISABLED`
- kill switch active blocked with `TRADING_KILL_SWITCH_ACTIVE`
- non-allowlisted users blocked with `TRADING_NOT_ALLOWLISTED`
- allowlisted users allowed only when beta is enabled and kill switch is off
- admins are allowed only when beta is enabled and kill switch is off

Guarded order placement route:

- `POST /api/orders`

Legacy orderbook placement routes are guarded and then disabled with `LEGACY_ORDER_PLACEMENT_DISABLED`:

- `POST /api/orderbook/place`
- `POST /api/orderbook/[marketId]/orders/place`

This makes canonical `POST /api/orders` the only internal beta order placement path, preserving idempotency and canonical governance checks.

## Ledger Behavior

No new ledger math was added.

When the guarded path is enabled and an order is accepted, existing matching code can:

- create an `Order`
- reserve BUY notional as locked USDC
- create `LOCK` ledger entries
- create fills/trades if the order crosses existing liquidity
- update positions and balances for fills

This is real runtime behavior, not UI-only.

## What Remains Disabled

By default, order placement remains disabled because:

- `INTERNAL_TRADING_BETA_ENABLED` defaults false
- `TRADING_KILL_SWITCH` defaults true
- the Phase E UI submit gate defaults disabled unless `NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=true`

Public trading is not enabled by this PR.

## What Is Not Implemented

- public trading
- anonymous trading
- settlement
- market resolution runtime
- new order schema
- new migration
- new funding behavior
- deposit/withdrawal changes
- live bot matching or live bot activation
- public sportsbook/provider integration

## Tests Added

Added:

```text
src/__tests__/internal-trading-beta.test.ts
src/__tests__/orders.internal-trading-gate.route.test.ts
```

Updated:

```text
src/__tests__/orderbook.place-cancel.events.test.ts
```

Coverage:

- beta disabled blocks
- kill switch blocks
- non-allowlisted user blocks
- allowlisted users/admins can pass only when beta is enabled and kill switch is off
- `POST /api/orders` calls the trading gate before `submitCanonicalOrder`
- blocked gate does not call `submitCanonicalOrder`
- allowed gate permits the existing route to call `submitCanonicalOrder`
- legacy orderbook placement routes do not call matching or emit orderbook events
- legacy orderbook placement routes return replacement guidance for `POST /api/orders`

## Validation

Passed locally:

- `git diff --check`
- `npx prisma generate --schema=prisma/schema.prisma`
- `npx prisma validate --schema=prisma/schema.prisma`
- `npx jest --runInBand src/__tests__/internal-trading-beta.test.ts src/__tests__/orders.internal-trading-gate.route.test.ts src/__tests__/orderbook.place-cancel.events.test.ts src/__tests__/market-trade-ticket-v1.test.ts`
- `npx tsc --noEmit --pretty false --incremental false`
- `npm run test:ci`
- `npm run build`

Note:

- One parallel TypeScript run failed while `next build` was regenerating `.next/types/validator.ts`.
- Rerunning `npx tsc --noEmit --pretty false --incremental false` after build completed passed.

- `git diff --cached --check`

## Risk Assessment

Risk level: high.

This PR touches the order/trading boundary. Even though defaults keep trading disabled, the guarded path can create real orders and ledger locks if all server and client flags are explicitly enabled.

This PR must remain open for review. Do not auto-merge.

## Next Phase

Next recommended phase after review and merge:

```text
Phase G: Portfolio Positions and Open Orders
```

Phase G should focus on clear display of available/locked balance, open orders, positions, and empty states. Settlement and market resolution remain separate later phases.

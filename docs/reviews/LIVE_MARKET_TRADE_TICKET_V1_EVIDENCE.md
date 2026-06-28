# Live Market Trade Ticket V1 Evidence

Date: 2026-06-24

## Summary

Phase E adds a disabled/default preview boundary for the existing market detail trade ticket.

The market detail page can still show:

- outcome selection
- buy/sell side controls
- market/limit mode controls
- quantity/amount inputs
- estimated shares
- estimated cost
- max payout / receive estimates already present in the ticket
- best bid / best ask
- available balance display

By default, `submissionEnabled` is false and the submit button is disabled unless an explicit public internal trading flag is set:

```text
NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED=true
```

This phase does not implement a new order API, matching engine, ledger behavior, settlement, market resolution, funding, withdrawal, provider sync, or bot behavior.

## Files Changed

- `src/components/market/orderbook/OrderTicket.tsx`
- `src/components/market/orderbook/OrderbookMarketView.tsx`
- `src/__tests__/market-trade-ticket-v1.test.ts`
- `docs/reviews/LIVE_MARKET_TRADE_TICKET_V1_EVIDENCE.md`
- `docs/reviews/LIVE_MARKET_BETA_CONTINUATION_PROMPT.md`

## Behavior

`OrderTicket` now accepts:

```text
submissionEnabled?: boolean
```

When `submissionEnabled` is false:

- the submit button says `Trading disabled`
- the form is disabled
- `handleSubmit` returns before building/submitting an order payload
- no `/api/orders` POST is made from the ticket
- no balance mutation occurs from this UI
- no ledger mutation occurs from this UI

`OrderbookMarketView` passes:

```text
submissionEnabled={internalTradingEnabled}
```

where `internalTradingEnabled` is true only when:

```text
process.env.NEXT_PUBLIC_INTERNAL_TRADING_BETA_ENABLED === "true"
```

## Safety Boundary

This PR intentionally does not enable real internal trading by default.

Because this touches the order submission boundary, the PR should remain open for review unless the owner explicitly approves merging the disabled/default ticket gate.

## Tests Added

Added:

```text
src/__tests__/market-trade-ticket-v1.test.ts
```

Coverage:

- market detail uses the explicit internal trading flag
- order ticket receives the submission gate
- disabled ticket short-circuits before submit
- disabled ticket copy states that it does not create orders, mutate balances, or write ledger entries

## Validation

Passed locally:

- `git diff --check`
- `npx prisma generate --schema=prisma/schema.prisma`
- `npx prisma validate --schema=prisma/schema.prisma`
- `npx jest --runInBand src/__tests__/market-trade-ticket-v1.test.ts src/__tests__/order_ticket_logic.test.ts`
- `npx tsc --noEmit --pretty false --incremental false`
- `npm run test:ci`
- `npm run build`
- `git diff --cached --check`

## Not Implemented

- internal trading allowlist
- internal trading kill switch
- order holds
- new order placement flow
- settlement
- market resolution
- portfolio/open order redesign
- admin approval workflow
- live bot activation

## Next Phase

Next recommended phase after review:

```text
Phase F: Internal Beta Order Placement
```

Phase F is high risk and should not be auto-merged. It must add authenticated internal user gating, allowlist checks, kill switch behavior, balance checks, ledger order holds, idempotency, and tests before any internal order placement is enabled.

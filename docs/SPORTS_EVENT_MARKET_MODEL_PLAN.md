# Sports Event Market Model Plan

## Current Architecture

- `Event` already exists and groups markets, mostly for reference/Polymarket imports.
- `Market` already has optional `eventId`, public/private visibility, orderbook/pool mechanism, lifecycle status, and `resolvedOutcomeId`.
- `Outcome` belongs to `Market`; orders, trades, positions, fills, and pool bets all reference `outcomeId`.
- Orderbook trading is outcome-based inside a market. This supports multi-outcome sports markets without replacing matching.
- Settlement is manual through `resolveOrderbookMarket`, which takes a winning outcome and reuses the existing ledger/balance/position flow.
- Existing generic markets can remain available through `/api/markets` and are grouped under a default general event by migration.

## Required Change

- Add sports-specific event metadata fields.
- Add non-breaking market template metadata fields.
- Add non-breaking outcome code/status/metadata fields.
- Add sports market template creation service and admin routes.
- Add sports public event routes and filters.
- Seed demo sports events and markets.

## Not Touched

- Matching engine.
- Ledger accounting.
- Wallets, withdrawals, deposits, or crypto payout behavior.
- Public deployment or production configuration.
- Player props, pick slips, parlays, or combo picks.
- `poly-bot` runtime logic.

## Migration Risk

- The migration is additive except for adding `PAUSED` and `CANCELED` values to the existing `MarketStatus` enum.
- `eventId` stays nullable for code compatibility, but existing null markets are assigned to `General Prediction Markets`.
- Existing order, trade, position, balance, and settlement tables are not altered.
- The new partial unique index on `(marketId, code)` only applies where `code IS NOT NULL`.

## Test Plan

- Validate Prisma schema and generate client.
- Add focused service/route tests for event creation, sports templates, event detail, and generic-market compatibility.
- Run existing settlement/orderbook tests where feasible.
- Run `scripts/agent/pre-pr-check.sh`.

# Cycle ZAD - Server Cashout Estimate Contract

## Scope

Internal tester trading flow only: Portfolio/Event Detail owned position -> Cash out -> close-position ticket -> SELL order. No order book UI, chat, live stats, schema migration, or runtime/operator infrastructure was added.

## Actual Gap

The phone cashout UI had already been fixed to use close-position mode, but the opening path still derived available shares and sell price primarily from the Portfolio snapshot plus market quote. A server cashout estimate service existed, but mobile could not call it directly.

## Expected Behavior

- Cashout estimate is read from backend-owned position state when available.
- Max uses owned position shares, not wallet cash.
- Sell price/proceeds use the current bid/exit price.
- The close-position ticket keeps hiding the Yes/No selector.
- Actual close still submits a SELL order with owned `marketId`, `outcomeId`, share size, and price.

## Changes

- Added `GET /api/portfolio/cash-out/estimate`.
- Added `PolyApi.getCashOutEstimate`.
- Updated `openPositionTrade` to request the estimate before opening a server-mode sell ticket.
- Kept the existing quote/portfolio fallback for stale or unavailable estimates.

## Evidence

- Backend focused tests: `src/__tests__/cash-out.service.test.ts`, `src/__tests__/portfolio.cash-out-estimate.route.test.ts`.
- Mobile API/source contract tests updated for the estimate route and close-position opening path.
- S23 proof: `docs/mobile/harness/cycle-ZAD-server-cashout-estimate-s23/cycle-ZAD-odds-api-s23-visible-flow.json`.
- S23 assertions: `cashoutTicketOpened=true`, `cashoutTicketIsClosePositionMode=true`, `cashoutMaxUsesOwnedShares=true`, `cashoutTicketHidesYesNoSelector=true`, `cashoutSellSubmitted=true`, `cashoutHistoryVisible=true`.

## Gaps

- P0: none introduced by this cycle.
- P1: none for the internal tester cashout path. Production-grade execution guarantee and fee/slippage preview remain outside local MVP scope.
- P2: estimate response does not yet model fees, slippage, or guaranteed execution.

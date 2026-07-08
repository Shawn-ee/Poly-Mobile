# Cycle KF - Ticket Quote Route Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile ticket quote service reads backend `/api/markets/:id/quote`.
- Backend quote route provides outcome-filtered best bid/ask, size, midpoint, and last price data for ticket pricing.
- No order book UI work and no Trade Ticket visual redesign.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Mobile quote service uses backend quote route | Pass | `mobile/src/__tests__/quoteService.test.ts` covers `loadTicketQuotes()` calling `getMarketQuote(marketId, outcomeId)`. |
| Backend route forwards market/outcome to canonical quote service | Pass | `src/__tests__/market.quote.route.test.ts` verifies `/api/markets/[id]/quote?outcomeId=...` calls `getCanonicalMarketQuote()` with the selected market/outcome. |
| Route proof covers real depth and last price data | Pass | `scripts/prove_mobile_ticket_quote_route_contract.ts` seeds local bid/ask orders plus a fill, then drives `loadTicketQuotes()` through the real route handler. |
| Ticket quote preserves top-of-book sizes | Pass | Proof verifies best bid/ask percentages and `bestBidSize`/`bestAskSize` from backend orderbook depth. |
| Cycle avoids unrelated UI/orderbook churn | Pass | No edits to `mobile/App.tsx`, `TradeTicket.tsx`, `EventDetail.tsx`, order book UI, chat, live stats, deposits, or withdraws. |

## Change Notes

- Added a route-level unit test for `/api/markets/[id]/quote`.
- Added a focused route proof artifact for mobile ticket quote loading.
- Reused existing canonical quote and public orderbook snapshot services. No schema migration was added.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/quoteService.test.ts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/market.quote.route.test.ts src/__tests__/orderbook-pricing.quote-size.test.ts` - pass.
- `npx tsx scripts/prove_mobile_ticket_quote_route_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle KF"` - pass.

## Remaining P1

- Wire dirty visible Trade Ticket/Event Detail quote refresh behavior after unrelated screen churn is reconciled.
- Production provider quote breadth remains tracked under provider mapping/provider refresh lanes.

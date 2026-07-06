# Cycle KO - Trade Ticket Quote UI Wiring

Gate status: Pass

Scope: Backend/data-contract gate for visible Trade Ticket and Event Detail quote refresh using `/api/markets/:id/quote` in server mode. This does not add order book, chat, live stats, visual redesign, deposits, or withdrawals.

## P0 Checklist

- Visible Trade Ticket server mode calls `loadTicketQuotes()` for the open ticket market/outcome.
- `loadTicketQuotes()` reads `/api/markets/:id/quote?outcomeId=...` through `PolyApi.getMarketQuote()`.
- Quote refresh is scoped to the still-open ticket market/outcome before updating ticket odds.
- Selected limit-price tickets and server open-order proof tickets do not overwrite their explicit ticket price with quote refresh.
- Visible Event Detail markets also refresh route-backed quote fields in server market-data mode.
- Route failure keeps the current ticket state; no frontend fake quote row is invented.

## Evidence

- Proof: `docs/mobile/harness/cycle-KO-trade-ticket-quote-ui-wiring/cycle-KO-trade-ticket-quote-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_trade_ticket_quote_ui_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/api.test.ts`
  - `mobile/src/__tests__/quoteService.test.ts`
- Focused backend tests:
  - `src/__tests__/market.quote.route.test.ts`
  - `src/__tests__/orderbook-pricing.quote-size.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Trade Ticket quote route UI wiring.
- Remaining P1: optional Android proof if visual proof becomes required again; production provider quote breadth remains under provider lanes.

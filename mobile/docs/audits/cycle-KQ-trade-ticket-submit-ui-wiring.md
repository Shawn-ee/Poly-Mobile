# Cycle KQ - Trade Ticket Submit UI Wiring

Gate status: Pass

Scope: Backend/data-contract gate for visible Trade Ticket submit using `POST /api/orders` in server mode. This does not redesign the ticket, add order book, chat, live stats, deposits, or withdrawals.

## P0 Checklist

- Visible Trade Ticket submit control requires a positive amount and tradable market.
- The submit control supports the visible swipe-up gesture and press fallback.
- The visible Trade Ticket calls `placeOrder(numericAmount, side, contractSide)`.
- `App.tsx` passes that `placeOrder` handler into `TradeTicket`.
- `placeOrder()` calls `submitTicketOrder()` with the open ticket market, outcome, side, contract side, selection, and amount.
- `submitTicketOrder()` server mode calls the canonical order route through `PolyApi.placeLimitOrder()`.
- Server-mode submit navigates to Portfolio and refreshes route-backed Portfolio state.

## Evidence

- Proof: `docs/mobile/harness/cycle-KQ-trade-ticket-submit-ui-wiring/cycle-KQ-trade-ticket-submit-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_trade_ticket_submit_ui_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/api.test.ts`
  - `mobile/src/__tests__/orderService.test.ts`
- Focused backend tests:
  - `src/__tests__/orders.internal-trading-gate.route.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Trade Ticket submit UI route wiring.
- Remaining P1: broader provider-family submit breadth if future gates require it; optional Android proof if visual proof becomes required again.

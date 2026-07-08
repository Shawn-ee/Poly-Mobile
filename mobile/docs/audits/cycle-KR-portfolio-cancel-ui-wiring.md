# Cycle KR - Portfolio Cancel UI Wiring

Gate status: Pass

Scope: Backend/data-contract gate for visible Portfolio open-order cancel using `DELETE /api/orders/:id` in server mode. This does not redesign Portfolio, add order book, chat, live stats, deposits, or withdrawals.

## P0 Checklist

- Visible Portfolio open-order rows render a `cancel-open-order-*` button.
- The visible cancel button calls `cancelOpenOrder(order)`.
- `App.tsx` passes the cancel handler into `Portfolio`.
- `cancelOpenOrder()` calls `cancelOpenOrderOnServer()` with the active API client in server mode.
- Server-mode cancel uses `PolyApi.cancelOrder()` and canonical `DELETE /api/orders/:id`.
- Server-mode cancel refreshes Portfolio from `/api/portfolio` and `/api/portfolio/history`.
- Cancel failure marks Portfolio sync error instead of silently pretending backend cancel succeeded.

## Evidence

- Proof: `docs/mobile/harness/cycle-KR-portfolio-cancel-ui-wiring/cycle-KR-portfolio-cancel-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_portfolio_cancel_ui_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/api.test.ts`
  - `mobile/src/__tests__/openOrderService.test.ts`
- Focused backend tests:
  - `src/__tests__/orders.cancel.route.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Portfolio cancel UI route wiring.
- Remaining P1: broader provider-family cancel breadth if future gates require it; optional Android proof if visual proof becomes required again.

# Cycle ZAB - Spain vs. France S23 Cashout Proof

Scope: current `main` internal tester mobile trading flow for the backend-owned Odds API Spain vs. France event. This cycle did not change product source code. It reran the real Samsung S23 path from a cleared Expo Go state after a first attempt captured Expo while it was still bundling.

## Device Proof

- Device: Samsung S23 `172.16.200.27:44029`, model `SM-S911U1`.
- Backend: local Holiwyn backend on port `3002`.
- Expo proof port: `8295`.
- Proof summary: `docs/mobile/harness/cycle-ZAB-spain-france-cashout-s23/cycle-ZAB-odds-api-s23-visible-flow.json`.
- Screenshots: `docs/mobile/screenshots/cycle-ZAB-spain-france-cashout-s23/`.
- UI hierarchy: `docs/mobile/harness/cycle-ZAB-spain-france-cashout-s23/`.

The proof covered:

1. Home shows the backend-owned Spain vs. France event.
2. Event Detail opens backend-loaded markets.
3. Total Goals 2.5 opens the Buy ticket.
4. Swipe buy submits a server-backed fake-token order and reaches Portfolio.
5. Portfolio position appears.
6. Cash out opens close-position SELL ticket mode.
7. Max uses owned shares only.
8. The cashout ticket hides the generic Yes/No selector.
9. Swipe cashout submits a SELL.
10. Portfolio History shows the sell activity.

## Cashout Max Result

The ready cashout XML shows:

- `cashout-mode-active-true`
- `cashout-source-position-present`
- `cashout-effective-side-sell`
- `cashout-ticket-no-yes-no-selector`
- `cashout-max-owned-shares`
- `cashout-available-shares-43.100000`
- amount display text: `43.1`
- unit text: `SHARES`
- helper text: `Sell up to 43.1 shares`

The ready XML does not contain the old wallet-sized failure strings `9000 USDT`, `9,000 USDT`, `10000 USDT`, or `10,000 USDT`. A raw substring search for `10000` can match the decimal tail of `43.100000`; that is not a wallet-balance amount.

## Validation

- Mobile typecheck: `npm --prefix mobile run typecheck` passed.
- Focused mobile cashout/portfolio tests: `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/positionCloseService.test.ts mobile/src/__tests__/cashoutGenericSellOnlyContract.test.ts mobile/src/__tests__/tradeTicketModeClarityContract.test.ts mobile/src/__tests__/portfolioPositionTradeContract.test.ts mobile/src/__tests__/eventDetailPositionTradeContract.test.ts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts` passed, 45 tests.
- Root typecheck: `npx tsc --noEmit --pretty false --incremental false` passed.
- Focused backend/order checks: `npx jest --runInBand --detectOpenHandles src/__tests__/order_ticket_logic.test.ts src/__tests__/wallet.balance.route.test.ts src/__tests__/mobile.the-odds-api-single-event.contract.test.ts` passed, 46 tests.
- Focused backend cashout/portfolio checks: `npx jest --runInBand --detectOpenHandles src/__tests__/cash-out.service.test.ts src/__tests__/portfolio.history.route.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.value-history.route.test.ts` passed, 21 tests.

## Gap Status

- P0: none for the tested Spain vs. France Home -> Event Detail -> Buy -> Portfolio -> Cashout Max -> Sell -> History flow.
- P1: a dedicated mobile/backend close-position preview route would simplify UI display state, but it is not required for internal tester trading.
- P2: copy and visual polish can continue later after tester feedback.

# Cycle ODDSAPIS23CASHOUTFRESH - Spain vs. France Cashout Proof

## Scope

- Current `main` internal tester trading flow for the backend-owned Odds API event `Spain vs. France`.
- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Required path: Home -> Event Detail -> Total Goals 2.5 -> Buy ticket -> fake-token order -> Portfolio position -> Cash out -> Max -> Sell -> Portfolio History.

## Result

Pass on 2026-07-13.

The proof first exposed stale replay drift: a normal proof run could reseed the reusable `odds-api-single-soccer-test` slug from the older Switzerland vs. Argentina redacted fixture. The script now restores the cached live Spain vs. France runtime event by default instead of replaying stale fixture data. The cached restore also writes normalized soccer metadata so both Home and Event Detail report `resultMode=must_advance` and `primaryMarketProfile=advance`.

## Evidence

- Summary: `docs/mobile/harness/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23CASHOUTFRESH-odds-api-s23-visible-flow.json`
- Home: `docs/mobile/screenshots/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23CASHOUTFRESH-home.png`
- Event Detail: `docs/mobile/screenshots/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23CASHOUTFRESH-detail-top.png`
- Line market: `docs/mobile/screenshots/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23CASHOUTFRESH-line-market.png`
- Buy ticket: `docs/mobile/screenshots/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23CASHOUTFRESH-ticket-ready.png`
- Portfolio after buy: `docs/mobile/screenshots/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23CASHOUTFRESH-after-submit.png`
- Cashout Max: `docs/mobile/screenshots/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23CASHOUTFRESH-cashout-ticket-ready.png`
- Portfolio History: `docs/mobile/screenshots/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23CASHOUTFRESH-portfolio-history.png`

## Cashout Contract Evidence

- `cashoutTicketIsClosePositionMode = true`
- `cashoutMaxUsesOwnedShares = true`
- `cashoutTicketHidesYesNoSelector = true`
- `cashoutSellSubmitted = true`
- `cashoutHistoryVisible = true`
- Cashout ready XML includes `cashout-mode-active-true`, `cashout-source-position-present`, `cashout-effective-side-sell`, `cashout-available-shares-43.100000`, `cashout-max-owned-shares`, and `cashout-share-quantity-display`.
- Max displayed `43.1` shares with `43.1 shares available at 58%`.
- No wallet-sized cashout amount appeared; the proof rejects `9,000 USDT`, `9000 USDT`, `10,000 USDT`, and `10000 USDT`.

## Event Semantics Evidence

- Home route now reports `resultMode=must_advance`, `primaryMarketProfile=advance`, and `marketProfile=full_match_with_overtime`.
- Home top rail shows only `France advances` and `Spain advances`; Draw is not exposed as a top primary action.
- Regulation-time/draw markets remain lower game-line markets, not the primary knockout action.

## Validation

- Focused backend tests: `npx jest --runInBand src/__tests__/public.events.no-leak.test.ts src/__tests__/cash-out.service.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/mobile.the-odds-api-single-event.contract.test.ts`
- Focused mobile tests: `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/positionCloseService.test.ts mobile/src/__tests__/cashoutGenericSellOnlyContract.test.ts mobile/src/__tests__/portfolioPositionTradeContract.test.ts mobile/src/__tests__/eventDetailPositionTradeContract.test.ts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/positionTradeTicketService.test.ts`
- Root typecheck: `npx tsc --noEmit --pretty false --incremental false`
- Mobile typecheck: `npm --prefix mobile run typecheck`
- Full Jest CI: `npm run test:ci`
- Runtime status: `npm run mobile:one-event-runtime-status`
- Phase audit: `npm run mobile:one-event-phase-audit`
- Completion audit: `npm run mobile:live-runtime-completion-audit`

## Gaps

- P0: none for the tested Spain vs. France buy -> Portfolio -> cashout Max -> sell -> History flow.
- P1: spread and extra total markets still include Holiwyn-owned contract fixtures where current provider data is unavailable.
- P1: local supervisor/result-poller are proven but not currently running continuously after proof cleanup.
- P2: multi-event provider polling remains future work.

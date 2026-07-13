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

## Fresh S23 Regression Check - 2026-07-13 09:28 CT

Reason: manual S23 testing showed retail outcome taps could reopen a sell ticket from saved defaults, which made the app feel like cashout/sell mode was leaking into normal buy flows.

Device and runtime:

- Samsung S23: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Backend: `http://127.0.0.1:3002`, health `ok`, DB `connected`.
- Expo: `8081`, restarted with cache clear and server-mode env.
- Maker seed: `npm run mobile:one-event-live-runtime -- -BackendPort 3002 -SeedMaker`, no Odds API quota spend.

Code fix:

- Home/Market list retail outcome buttons now call `openTicket(..., "buy")` explicitly.
- This prevents a saved/default sell side from opening `Swipe to sell` when a user taps a normal Home outcome card.
- Regression test: `mobile/src/__tests__/marketListsRetailTicketSideContract.test.ts`.

Fresh proof:

- Home showed backend-owned `Spain vs. France`.
- Event Detail loaded backend markets and showed knockout top buttons without Draw.
- Initial bug reproduction: tapping the Home `France advances` rail before the fix opened `ticket-order-mode-sell` and failed with `Insufficient shares`.
- After the fix, the same Home rail opened `ticket-order-mode-buy` with `Yes - France advances`.
- Provider-backed `Total Goals 2.5` was used for the full fill/cashout proof because the maker seed prepared that market.
- Buy proof: S23 bought `Yes Over 2.5 total goals` for `1 USDT`; Portfolio showed a filled position with `1.67` shares.
- Cashout initial XML included `cashout-mode-active-true`, `cashout-source-position-present`, `cashout-ticket-side-sell`, `cashout-effective-side-sell`, `cashout-available-shares-1.670000`, and `cashout-sell-price-0.58`.
- Cashout Max proof: amount display showed `1.67 SHARES`, estimated proceeds `$0.97`, and helper text `Sell up to 1.67 shares`.
- No wallet-sized value appeared in the close-position ticket; the `$9,999` wallet balance remained only in the Portfolio header.
- Cashout submit closed the position; Positions showed `No positions yet`.
- History showed `Sold ... Over 2.5 total goals` and `Bought ... Over 2.5 total goals`, both preserving the same sportsbook-backed market/outcome identity.

Local evidence artifacts:

- `docs/mobile/harness/s23-cashout-proof/buy-ticket-patched.xml`
- `docs/mobile/harness/s23-cashout-proof/after-totals-buy.png`
- `docs/mobile/harness/s23-cashout-proof/cashout-ticket-max.png`
- `docs/mobile/harness/s23-cashout-proof/cashout-ticket-max.xml`
- `docs/mobile/harness/s23-cashout-proof/after-cashout.xml`
- `docs/mobile/harness/s23-cashout-proof/history-after-cashout.png`
- `docs/mobile/harness/s23-cashout-proof/history-after-cashout.xml`

Fresh gaps:

- P0: none for the tested current internal tester path.
- P1: the unseeded `France advances` quick buy can still become an open order if local maker liquidity is not seeded for that market. The current one-event maker seed prepares `Total Goals 2.5`; broaden seed selection only if internal testers need advance-market fills before line-market fills.
- P1: the generic buy ticket still exposes a Yes/No selector for binary markets. Cashout correctly hides it, but the retail buy ticket can be simplified later.

## Fresh S23 Current-Main Proof - 2026-07-13 11:49 CT

Reason: confirm the real phone is not running a stale bundle and cannot still produce a wallet-sized cashout amount like `$9000`.

Device and runtime:

- Samsung S23: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Branch: `main`.
- Backend: `http://127.0.0.1:3002`, health `ok`, DB `connected`.
- Mobile API: `http://172.16.200.14:3002`.
- Expo proof server: temporary clean server on port `8289`; proof script cleared Expo Go state before launch.

Fresh proof result:

- Result: pass.
- Home showed backend-owned `Spain vs. France`.
- Event Detail loaded backend markets.
- Buy flow selected sportsbook-backed `Total Goals 2.5`, outcome `Over 2.5`.
- Portfolio showed the filled position after buy.
- Portfolio `Cash out` opened close-position mode, not the generic buy ticket.
- Cashout ticket hid the Yes/No selector.
- Cashout `Max` used owned shares only: `43.1 SHARES`.
- Cashout ticket displayed `43.1 shares available at 58%` and `Sell up to 43.1 shares`.
- The proof explicitly rejected wallet-sized cashout strings: `9,000 USDT`, `9000 USDT`, `10,000 USDT`, and `10000 USDT`.
- Swipe cashout submitted a server-backed SELL for the owned market/outcome.
- Portfolio History showed the sold activity and preserved sportsbook-backed market identity.

Fresh evidence artifacts:

- Summary: `docs/mobile/harness/cycle-S23CASHOUTLIVE-spain-france-cashout/cycle-S23CASHOUTLIVE-odds-api-s23-visible-flow.json`
- Home: `docs/mobile/screenshots/cycle-S23CASHOUTLIVE-spain-france-cashout/cycle-S23CASHOUTLIVE-home.png`
- Event Detail: `docs/mobile/screenshots/cycle-S23CASHOUTLIVE-spain-france-cashout/cycle-S23CASHOUTLIVE-detail-top.png`
- Line market: `docs/mobile/screenshots/cycle-S23CASHOUTLIVE-spain-france-cashout/cycle-S23CASHOUTLIVE-line-market.png`
- Buy ticket ready: `docs/mobile/screenshots/cycle-S23CASHOUTLIVE-spain-france-cashout/cycle-S23CASHOUTLIVE-ticket-ready.png`
- Portfolio after buy: `docs/mobile/screenshots/cycle-S23CASHOUTLIVE-spain-france-cashout/cycle-S23CASHOUTLIVE-after-submit.png`
- Cashout Max: `docs/mobile/screenshots/cycle-S23CASHOUTLIVE-spain-france-cashout/cycle-S23CASHOUTLIVE-cashout-ticket-ready.png`
- Cashout Max XML: `docs/mobile/harness/cycle-S23CASHOUTLIVE-spain-france-cashout/cycle-S23CASHOUTLIVE-cashout-ticket-ready.xml`
- Portfolio History: `docs/mobile/screenshots/cycle-S23CASHOUTLIVE-spain-france-cashout/cycle-S23CASHOUTLIVE-portfolio-history.png`

Fresh validation:

- Focused mobile cashout/portfolio/order tests: `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/positionCloseService.test.ts mobile/src/__tests__/cashoutGenericSellOnlyContract.test.ts mobile/src/__tests__/portfolioPositionTradeContract.test.ts mobile/src/__tests__/eventDetailPositionTradeContract.test.ts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/positionTradeTicketService.test.ts` - pass, 37 tests.
- Mobile typecheck: `npm --prefix mobile run typecheck` - pass.
- Root typecheck: `npx tsc --noEmit --pretty false --incremental false` - pass.
- Backend CI: `npm run test:ci` - pass, 34 suites / 159 tests.

Fresh gaps:

- P0: none for the current Spain vs. France internal tester path Home -> Event Detail -> Buy -> Portfolio -> Cash out Max -> SELL -> History.
- P1: advance-market fills still depend on maker liquidity being seeded for that specific market; this proof used `Total Goals 2.5`.
- P1: local supervisor/result-poller remain proven but not installed as unattended production services.

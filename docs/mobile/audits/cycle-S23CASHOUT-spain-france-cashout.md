# Cycle S23CASHOUT - Spain vs. France Cashout S23 Proof

## Scope

- Internal tester mobile trading flow for the backend-owned Odds API event `Spain vs. France`.
- Required path: Home -> Event Detail -> Totals 2.5 -> Buy ticket -> Portfolio position -> Cash out -> Max -> Sell -> History.
- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.

## Fixes

- Home/event route now treats provider keys `soccer_fifa_world_cup` as World Cup soccer aliases when the mobile app requests `sportKey=soccer&leagueKey=world_cup`.
- Home mobile filtering now accepts the same provider sport/league aliases instead of dropping the event after the backend returns it.
- The S23 proof liquidity seeder now prefers active public orderbook markets, so stale closed replay markets with the same line do not block proof liquidity.
- The internal beta backend starter now loads the local env before starting, so clean restarts keep `DATABASE_URL` and backend health.

## S23 Proof

- Fresh proof run: 2026-07-14, current `main`, clean Expo server-mode bundle.
- Summary: `docs/mobile/harness/cycle-S23CASHOUT-spain-france-cashout/cycle-S23CASHOUT-odds-api-s23-visible-flow.json`
- Home screenshot: `docs/mobile/screenshots/cycle-S23CASHOUT-spain-france-cashout/cycle-S23CASHOUT-home.png`
- Event detail screenshot: `docs/mobile/screenshots/cycle-S23CASHOUT-spain-france-cashout/cycle-S23CASHOUT-detail-top.png`
- Line market screenshot: `docs/mobile/screenshots/cycle-S23CASHOUT-spain-france-cashout/cycle-S23CASHOUT-line-market.png`
- Buy ticket screenshot: `docs/mobile/screenshots/cycle-S23CASHOUT-spain-france-cashout/cycle-S23CASHOUT-ticket-ready.png`
- Portfolio after buy: `docs/mobile/screenshots/cycle-S23CASHOUT-spain-france-cashout/cycle-S23CASHOUT-after-submit.png`
- Cashout Max screenshot: `docs/mobile/screenshots/cycle-S23CASHOUT-spain-france-cashout/cycle-S23CASHOUT-cashout-ticket-ready.png`
- Portfolio History screenshot: `docs/mobile/screenshots/cycle-S23CASHOUT-spain-france-cashout/cycle-S23CASHOUT-portfolio-history.png`

## Cashout Contract Evidence

- `cashoutTicketIsClosePositionMode = true`
- `cashoutMaxUsesOwnedShares = true`
- `cashoutTicketHidesYesNoSelector = true`
- `cashoutSellSubmitted = true`
- `cashoutHistoryVisible = true`
- Cashout Max displayed `43.1` owned shares, with `43.1 shares available at 58%`.
- Cashout amount display used share units: `43.1 SHARES`.
- Cashout ticket header used the close-position label: `Cash out Over 2.5`.
- Cashout estimated proceeds were `$25` from `43.1` shares at the `0.58` bid.
- The close ticket XML included `cashout-mode-active-true`, `cashout-source-position-present`, `cashout-effective-side-sell`, and `cashout-max-owned-shares`.
- The proof rejects wallet-sized cashout values including `9,000 USDT`, `9000 USDT`, `10,000 USDT`, and `10000 USDT`.

## Validation

- Mobile focused tests: `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/cashoutGenericSellOnlyContract.test.ts mobile/src/__tests__/positionCloseService.test.ts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/portfolioPositionTradeContract.test.ts mobile/src/__tests__/eventDetailPositionTradeContract.test.ts mobile/src/__tests__/tradeTicketModeClarityContract.test.ts mobile/src/__tests__/portfolioHistorySellLabelContract.test.ts`
  - Result: pass, 7 files / 37 tests.
- Backend focused tests: `npx jest --runInBand src/server/services/__tests__/canonical_order_submission.phase5.test.ts src/server/services/__tests__/phase7_kalshi_model.test.ts`
  - Result: pass, 2 suites / 36 tests.
- S23 proof: `powershell -ExecutionPolicy Bypass -File scripts/prove_mobile_odds_api_s23_visible_flow.ps1 -Cycle S23CASHOUT -OutputDir docs\mobile\screenshots\cycle-S23CASHOUT-spain-france-cashout -HierarchyOutputDir docs\mobile\harness\cycle-S23CASHOUT-spain-france-cashout`
  - Result: pass on `SM-S911U1`.

## Gaps

- P0: none for the tested Spain vs. France buy -> Portfolio -> cashout -> History flow.
- P1: the event still mixes sportsbook-backed totals with Holiwyn-owned contract fixtures where provider line markets are unavailable.
- P2: cashout visual polish can still improve later, but the Max/share behavior is correct for internal testing.

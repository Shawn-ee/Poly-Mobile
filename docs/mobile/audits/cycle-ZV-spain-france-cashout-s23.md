# Cycle ZV - Spain vs France S23 Cashout Proof

Date: 2026-07-14

Scope: current `main` internal tester mobile flow for the backend-owned Odds API event, Spain vs. France. This cycle did not add feature code. It reran the real S23 path from a cleared Expo Go state to prove Portfolio cashout opens the close-position ticket, not the generic buy ticket.

## Device And Runtime

- Android device: `172.16.200.27:44029`
- Model: `SM-S911U1`
- Backend: `http://127.0.0.1:3002`, health passed with database connected
- Mobile mode: Expo Go launched by proof script with cache clear, `EXPO_PUBLIC_MARKET_DATA_MODE=server`, `EXPO_PUBLIC_ORDER_MODE=server`
- Event: `odds-api-single-soccer-test`, visible as Spain vs. France
- Selected market: Total Goals 2.5, Over 2.5

## Validation

- Mobile typecheck: pass
- Focused mobile cashout/portfolio contracts: pass
- Focused backend cashout/open-order tests: pass
- S23 end-to-end proof: pass

Focused commands:

```powershell
npm --prefix mobile run typecheck
npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/positionCloseService.test.ts mobile/src/__tests__/cashoutGenericSellOnlyContract.test.ts mobile/src/__tests__/tradeTicketModeClarityContract.test.ts mobile/src/__tests__/portfolioPositionTradeContract.test.ts mobile/src/__tests__/eventDetailPositionTradeContract.test.ts
npx jest --runInBand src/__tests__/cash-out.service.test.ts src/__tests__/portfolio.open-orders.route.test.ts
powershell -ExecutionPolicy Bypass -File scripts\prove_mobile_odds_api_s23_visible_flow.ps1 -Device 172.16.200.27:44029 -Cycle ZV -OutputDir docs\mobile\screenshots\cycle-ZV-spain-france-cashout-s23 -HierarchyOutputDir docs\mobile\harness\cycle-ZV-spain-france-cashout-s23 -Port 8293
```

## Evidence

- Summary: `docs/mobile/harness/cycle-ZV-spain-france-cashout-s23/cycle-ZV-odds-api-s23-visible-flow.json`
- Home screenshot: `docs/mobile/screenshots/cycle-ZV-spain-france-cashout-s23/cycle-ZV-home.png`
- Event detail screenshot: `docs/mobile/screenshots/cycle-ZV-spain-france-cashout-s23/cycle-ZV-detail-top.png`
- Line market screenshot: `docs/mobile/screenshots/cycle-ZV-spain-france-cashout-s23/cycle-ZV-line-market.png`
- Buy ticket screenshot: `docs/mobile/screenshots/cycle-ZV-spain-france-cashout-s23/cycle-ZV-ticket-ready.png`
- Portfolio after buy screenshot: `docs/mobile/screenshots/cycle-ZV-spain-france-cashout-s23/cycle-ZV-after-submit.png`
- Cashout Max screenshot: `docs/mobile/screenshots/cycle-ZV-spain-france-cashout-s23/cycle-ZV-cashout-ticket-ready.png`
- Cashout Max XML: `docs/mobile/harness/cycle-ZV-spain-france-cashout-s23/cycle-ZV-cashout-ticket-ready.xml`
- Portfolio History screenshot: `docs/mobile/screenshots/cycle-ZV-spain-france-cashout-s23/cycle-ZV-portfolio-history.png`

## Cashout Result

The S23 cashout ticket opened in close-position mode.

- `cashoutTicketIsClosePositionMode = true`
- `cashoutMaxUsesOwnedShares = true`
- `cashoutTicketHidesYesNoSelector = true`
- `cashoutSellSubmitted = true`
- `cashoutHistoryVisible = true`

The cashout Max XML showed:

- visible amount: `43.1`
- unit: `SHARES`
- helper: `43.1 shares available at 58%`
- sell price marker: `cashout-sell-price-0.58`
- owned shares marker: `cashout-available-shares-43.100000`
- submit payload identity markers: owned market/outcome plus `ticket-limit-side-bid`, `ticket-limit-price-58`, and `ticket-limit-shares-43.1`

The proof did not show a wallet-sized cashout amount. The ready XML does not contain the old failure values `9000 USDT`, `9,000 USDT`, `10000 USDT`, or `10,000 USDT`. The generic Yes/No selector is hidden in close-position mode.

## Gaps

- P0: none for the tested Spain vs. France Home -> Event Detail -> Buy -> Portfolio -> Cashout Max -> Sell -> History path.
- P1: cashout can later use a richer close-position quote preview route, but the current internal tester path uses the executable bid and sells owned shares.
- P2: visual polish can continue after internal tester trading remains stable.

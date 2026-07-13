# Cycle ZK - Spain vs France Cashout Fresh S23 Proof

## Scope

Fresh real-device proof from current `main` for the internal tester flow:

Home -> Spain vs. France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio position -> Cash out -> Max -> Sell -> Portfolio History.

This cycle specifically rechecked the real-phone bug where Portfolio Cash out -> Max could use wallet balance instead of owned position shares.

## Device And Runtime

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Backend: `http://127.0.0.1:3002`
- Mobile API from phone: `http://172.16.200.14:3002`
- Expo port: `8289`
- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Selected market: `Total Goals`, line `2.5`, outcome `Over 2.5`

## Evidence

- Summary: `docs/mobile/harness/cycle-ZK-spain-france-cashout-fresh/cycle-ZK-SPAIN-FRANCE-CASHOUT-FRESH-odds-api-s23-visible-flow.json`
- Cashout ticket XML: `docs/mobile/harness/cycle-ZK-spain-france-cashout-fresh/cycle-ZK-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket.xml`
- Cashout ready XML after Max: `docs/mobile/harness/cycle-ZK-spain-france-cashout-fresh/cycle-ZK-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.xml`
- Cashout ready screenshot: `docs/mobile/screenshots/cycle-ZK-spain-france-cashout-fresh/cycle-ZK-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.png`
- Portfolio history screenshot: `docs/mobile/screenshots/cycle-ZK-spain-france-cashout-fresh/cycle-ZK-SPAIN-FRANCE-CASHOUT-FRESH-portfolio-history.png`

## Result

Pass.

The real S23 cashout ticket entered close-position mode. The XML shows:

- `cashout-mode-active-true`
- `cashout-source-position-present`
- `cashout-effective-side-sell`
- `cashout-available-shares-43.100000`
- `cashout-sell-price-0.58`
- `cashout-max-owned-shares`
- `cashout-share-quantity-display`
- `cashout-ticket-no-yes-no-selector`

After tapping Max, the active ticket displayed `43.1` shares and `shares` copy. It did not display wallet-sized values such as `9000`, `9,000`, `10000`, or `10,000`.

The proof summary assertions passed:

- Home shows the temporary sportsbook event.
- Event detail shows game lines.
- Ticket preserves sportsbook line identity.
- Buy submits and reaches Portfolio.
- Portfolio preserves sportsbook line identity.
- Cashout ticket opens in close-position mode.
- Cashout Max uses owned shares.
- Cashout ticket hides Yes/No selector.
- Cashout sell submits.
- Portfolio History updates.

## Validation

- Mobile focused tests: `npx vitest run --config mobile/vitest.config.ts --root . mobile/src/__tests__/cashoutGenericSellOnlyContract.test.ts mobile/src/__tests__/portfolioPositionTradeContract.test.ts mobile/src/__tests__/eventDetailPositionTradeContract.test.ts mobile/src/__tests__/orderService.test.ts mobile/src/__tests__/positionCloseService.test.ts mobile/src/__tests__/tradeTicketModeClarityContract.test.ts` passed, 36 tests.
- Backend focused DB safety tests: `npx jest --runInBand --detectOpenHandles --runTestsByPath src/server/services/__tests__/phase7_kalshi_model.test.ts` passed, 21 tests, with local `DATABASE_URL` loaded.

## Remaining Gaps

- P0: none for the tested Spain vs. France buy -> Portfolio -> cashout Max -> sell -> History flow.
- P1: dedicated backend cashout quote/preview fields remain useful so the mobile client does not have to assemble all close-ticket display state.
- P2: cashout copy can be polished further for tester readability.

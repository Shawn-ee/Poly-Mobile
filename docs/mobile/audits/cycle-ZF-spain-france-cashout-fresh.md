# Cycle ZF - Fresh Spain vs France Cashout Proof

## Scope

Fresh S23 proof from current `main` for the internal tester mobile trading flow:

Home -> Spain vs. France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio position -> Cash out -> Max -> Sell -> Portfolio History.

No source code changes were required. This cycle specifically rechecked the reported real-phone bug where Portfolio Cash out -> Max could use wallet balance instead of owned position shares.

## Device And Runtime

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Backend: `http://127.0.0.1:3002`
- Mobile API from phone: `http://172.16.200.14:3002`
- Expo port: `8291`
- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Selected market: `Total Goals`, line `2.5`, outcome `Over 2.5`

## Evidence

- Summary: `docs/mobile/harness/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-odds-api-s23-visible-flow.json`
- Cashout ticket XML: `docs/mobile/harness/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket.xml`
- Cashout ready XML after Max: `docs/mobile/harness/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.xml`
- Cashout ready screenshot: `docs/mobile/screenshots/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.png`
- Portfolio history screenshot: `docs/mobile/screenshots/cycle-ZF-spain-france-cashout-fresh/cycle-ZF-SPAIN-FRANCE-CASHOUT-FRESH-portfolio-history.png`

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

- Backend focused tests: `npx jest --runInBand src/__tests__/portfolio.history.route.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/orders.cancel.route.test.ts src/__tests__/order_ticket_logic.test.ts` passed, 23 tests.
- Mobile focused tests: `npx vitest run src/__tests__/cashoutGenericSellOnlyContract.test.ts src/__tests__/positionTradeTicketService.test.ts src/__tests__/portfolioPositionTradeContract.test.ts src/__tests__/portfolioHistoryService.test.ts src/__tests__/orderService.test.ts` passed, 31 tests.
- Mobile typecheck: `npm --prefix mobile run typecheck` passed.

## Remaining Gaps

- P0: none for the tested Spain vs. France buy -> Portfolio -> cashout Max -> sell -> History flow.
- P1: dedicated backend cashout quote/preview fields remain useful so the mobile client does not have to assemble all close-ticket display state.
- P2: cashout copy can be polished further for tester readability.

# Cycle S23CASHOUTMAIN - Spain vs France Cashout Proof

## Scope

Fresh S23 proof from current `main` for the internal tester mobile trading flow:

Home -> Spain vs. France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio position -> Cash out -> Max -> Sell -> Portfolio History.

No source code changes were required in this cycle. The purpose was to verify the real phone runtime path after the reported cashout bug where Max could show a wallet-sized amount.

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

- Summary: `docs/mobile/harness/cycle-S23CASHOUTMAIN-spain-france-cashout/cycle-S23CASHOUTMAIN-odds-api-s23-visible-flow.json`
- Cashout ticket XML: `docs/mobile/harness/cycle-S23CASHOUTMAIN-spain-france-cashout/cycle-S23CASHOUTMAIN-cashout-ticket-ready.xml`
- Cashout ticket screenshot: `docs/mobile/screenshots/cycle-S23CASHOUTMAIN-spain-france-cashout/cycle-S23CASHOUTMAIN-cashout-ticket-ready.png`
- Portfolio history screenshot: `docs/mobile/screenshots/cycle-S23CASHOUTMAIN-spain-france-cashout/cycle-S23CASHOUTMAIN-portfolio-history.png`

## Result

Pass.

The real S23 cashout ticket entered close-position mode. The ready-state XML shows:

- `cashout-mode-active-true`
- `cashout-source-position-present`
- `cashout-effective-side-sell`
- `cashout-available-shares-43.100000`
- `cashout-sell-price-0.58`
- `cashout-max-owned-shares`
- `cashout-share-quantity-display`

After tapping Max, the active ticket displayed `43.1` shares and `Odds 58% | 43.1 shares available`. It did not display a wallet-sized cashout amount such as `$9000` or `$10000`, and the active cashout ticket did not expose the generic Yes/No selector.

The proof summary assertions passed:

- Home shows the temporary sportsbook event.
- Event detail shows game lines.
- Order book and chat stay hidden.
- Ticket preserves sportsbook line identity.
- Buy submits and reaches Portfolio.
- Portfolio preserves sportsbook line identity.
- Cashout ticket opens.
- Cashout ticket is close-position mode.
- Cashout Max uses owned shares.
- Cashout ticket hides Yes/No selector.
- Cashout sell submits.
- Portfolio History updates.

## Validation

- Mobile focused tests: `npx vitest run src/__tests__/cashoutGenericSellOnlyContract.test.ts src/__tests__/positionCloseService.test.ts src/__tests__/orderService.test.ts src/__tests__/portfolioSnapshotService.test.ts` from `mobile` passed, 35 tests.
- Backend focused tests: `npx jest --runInBand src/server/services/__tests__/canonical_order_submission.phase5.test.ts src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts` passed, 29 tests.
- Mobile typecheck: `npm --prefix mobile run typecheck` passed.
- Root typecheck: `npx tsc --noEmit --pretty false --incremental false` passed.
- Runtime readiness gates after the local DB test reset and cached Spain vs. France restore passed:
  - `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
  - `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`
  - `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`

## Remaining Gaps

- P0: none for the tested Spain vs. France buy -> Portfolio -> cashout Max -> sell -> History flow.
- P1: dedicated backend cashout quote/preview fields remain useful so the mobile client does not have to assemble all close-ticket display state.
- P2: cashout copy can be polished further for tester readability.

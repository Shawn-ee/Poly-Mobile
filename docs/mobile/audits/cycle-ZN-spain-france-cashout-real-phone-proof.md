# Cycle ZN - Spain vs France Cashout Real Phone Proof

## Scope

Fresh S23 proof from current `main` for the internal tester trading flow:

Home -> Spain vs. France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio position -> Cash out -> Max -> Sell -> Portfolio History.

This cycle did not add UI features, order book work, chat, live stats, schema changes, or provider scans. It verifies the real phone path after the close-position cashout guard.

## Device And Runtime

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Backend: `http://127.0.0.1:3002`
- Mobile API from phone: `http://172.16.200.14:3002`
- Expo proof port: `8289`
- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Selected market: `Total Goals`, line `2.5`, outcome `Over 2.5`

## Evidence

- Summary: `docs/mobile/harness/cycle-ZM-spain-france-cashout-s23/cycle-ZM-odds-api-s23-visible-flow.json`
- Cashout ticket XML: `docs/mobile/harness/cycle-ZM-spain-france-cashout-s23/cycle-ZM-cashout-ticket.xml`
- Cashout ready XML after Max: `docs/mobile/harness/cycle-ZM-spain-france-cashout-s23/cycle-ZM-cashout-ticket-ready.xml`
- Cashout ready screenshot: `docs/mobile/screenshots/cycle-ZM-spain-france-cashout-s23/cycle-ZM-cashout-ticket-ready.png`
- Portfolio history screenshot: `docs/mobile/screenshots/cycle-ZM-spain-france-cashout-s23/cycle-ZM-portfolio-history.png`
- Backend route sell-safety proof: `docs/mobile/harness/cycle-JS-cashout-route-sell-safety/cycle-JS-cashout-route-sell-safety.json`

## Result

Pass.

The S23 proof summary passed these cashout assertions:

- `cashoutTicketOpened: true`
- `cashoutTicketIsClosePositionMode: true`
- `cashoutMaxUsesOwnedShares: true`
- `cashoutTicketHidesYesNoSelector: true`
- `cashoutSellSubmitted: true`
- `cashoutHistoryVisible: true`

The cashout ready XML shows the ticket in close-position mode with `ticket-limit-side-bid`, `ticket-limit-shares-43.1`, and visible helper text `Sell up to 43.1 shares`. It does not expose a wallet-sized Max value such as `$9000`, `9000`, `$10000`, or `10000`.

The backend sell-safety proof confirms:

- no-position sell is rejected
- oversell is rejected
- valid full-position sell is accepted

## Validation

- S23 visible proof: passed.
- Focused mobile cashout/portfolio tests: passed, 36 tests.
- Backend cashout sell-safety proof: passed.
- Root typecheck: passed.
- Root Jest CI suite: passed, 168 tests.
- Mobile typecheck: passed.

## Remaining Gaps

- P0: none for the tested Spain vs. France buy -> Portfolio -> cashout Max -> sell -> History path.
- P1: dedicated backend cashout preview fields would make proceeds/availability less dependent on client-side assembly.
- P2: cashout copy can still be polished after internal tester behavior remains stable.

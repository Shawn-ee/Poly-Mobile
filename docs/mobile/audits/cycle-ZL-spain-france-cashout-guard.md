# Cycle ZL - Spain vs France Cashout Guard

## Scope

Fresh S23 proof plus a defensive cashout guard for the current internal tester path:

Home -> Spain vs. France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio position -> Cash out -> Max -> Sell -> Portfolio History.

This cycle specifically prevents an owned-position sell ticket from falling back to generic wallet-balance sizing if the runtime ticket has `sourcePositionId` and sell-side share limits but misses the older `closePosition` object.

## Device And Runtime

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Backend: `http://127.0.0.1:3002`
- Mobile API from phone: `http://172.16.200.14:3002`
- Expo proof port: `8289`
- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Selected market: `Total Goals`, line `2.5`, outcome `Over 2.5`

## Implementation Notes

- `TradeTicket` now treats a sell ticket with `sourcePositionId` and either `closePosition` or `selection.limitShares` as close-position mode.
- Close-position available amount falls back to `selection.limitShares`.
- Close-position sell price falls back to `selection.limitPrice`.
- Submit logic in `mobile/App.tsx` uses the same close-position detection, so the order payload remains `SELL` with explicit owned-share size.
- The Event Detail cashout source test now resolves paths from repo root instead of depending on the current working directory.

## Evidence

- Summary: `docs/mobile/harness/cycle-ZL-spain-france-cashout-s23/cycle-ZL-odds-api-s23-visible-flow.json`
- Cashout ticket XML: `docs/mobile/harness/cycle-ZL-spain-france-cashout-s23/cycle-ZL-cashout-ticket.xml`
- Cashout ready XML after Max: `docs/mobile/harness/cycle-ZL-spain-france-cashout-s23/cycle-ZL-cashout-ticket-ready.xml`
- Cashout ready screenshot: `docs/mobile/screenshots/cycle-ZL-spain-france-cashout-s23/cycle-ZL-cashout-ticket-ready.png`
- Portfolio history screenshot: `docs/mobile/screenshots/cycle-ZL-spain-france-cashout-s23/cycle-ZL-portfolio-history.png`

## Result

Pass.

The S23 proof summary passed these relevant assertions:

- `cashoutTicketOpened: true`
- `cashoutTicketIsClosePositionMode: true`
- `cashoutMaxUsesOwnedShares: true`
- `cashoutTicketHidesYesNoSelector: true`
- `cashoutSellSubmitted: true`
- `cashoutHistoryVisible: true`

The cashout ticket proof rejects wallet-sized values such as `9000`, `9,000`, `10000`, and `10,000`, and requires the owned-share marker from the ticket XML before tapping Max.

## Validation

- Mobile typecheck: passed.
- Focused mobile tests: passed, 34 tests.
- S23 visible proof: passed on `SM-S911U1`.

## Remaining Gaps

- P0: none for the tested Spain vs. France buy -> Portfolio -> cashout Max -> sell -> History path.
- P1: a dedicated backend cashout preview route would still make proceeds and availability clearer.
- P2: cashout copy can be polished after internal tester behavior is stable.

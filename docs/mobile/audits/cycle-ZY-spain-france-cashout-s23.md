# Cycle ZY - Spain vs France S23 Cashout Proof

Date: 2026-07-13

## Scope

Fresh S23 proof from current `main` for the backend-owned Odds API event `Spain vs. France`.

This cycle did not add new runtime/operator infrastructure, provider scans, order book UI, chat, live stats, or broad feature work.

## Device

- Device: Samsung S23
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`

## Flow Proved

Home -> Spain vs France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio position -> Cash out -> Max -> Swipe cash out -> Portfolio History.

## Evidence

- Summary: `docs/mobile/harness/cycle-ZY-spain-france-cashout-s23/cycle-ZY-odds-api-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-ZY-spain-france-cashout-s23/`
- UI hierarchy: `docs/mobile/harness/cycle-ZY-spain-france-cashout-s23/`

## Results

- Home showed backend-owned `Spain vs. France`.
- Event Detail loaded backend markets.
- Buy flow submitted and reached Portfolio.
- Portfolio position appeared.
- Cash out opened the close-position SELL ticket.
- Cashout Max used owned shares, not wallet balance.
- No Yes/No selector appeared in close-position cashout mode.
- Sell submitted.
- Portfolio History showed the cashout/sell activity.

## Assertions

- `cashoutTicketIsClosePositionMode = true`
- `cashoutMaxUsesOwnedShares = true`
- `cashoutTicketHidesYesNoSelector = true`
- `cashoutSellSubmitted = true`
- `cashoutHistoryVisible = true`

## Gaps

- P0: none for the tested Spain vs France buy -> Portfolio -> cashout Max -> sell -> History path.
- P1: Google OAuth LAN/physical callback readiness remains separate from this cashout flow.
- P1: Provider-backed Polymarket match/line breadth remains unavailable in cached evidence and is not required for this backend-owned sportsbook internal tester flow.

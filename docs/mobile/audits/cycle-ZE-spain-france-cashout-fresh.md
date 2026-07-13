# Cycle ZE - Spain vs France Fresh S23 Cashout Proof

Date: 2026-07-13

## Scope

Fresh S23 proof from current `main` for the internal tester trading path on the backend-owned Odds API event `Spain vs. France`.

This cycle did not change source code and did not add runtime/operator infrastructure, order book UI, chat, live stats, provider scans, schema work, or cosmetic UI work.

## Device

- Device: Samsung S23
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`

## Flow Proved

Home -> Spain vs France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio position -> Cash out -> Max -> Swipe cash out -> Portfolio History.

## Evidence

- Summary: `docs/mobile/harness/cycle-ZE-spain-france-cashout-fresh/cycle-ZE-SPAIN-FRANCE-CASHOUT-FRESH-odds-api-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-ZE-spain-france-cashout-fresh/`
- UI hierarchy: `docs/mobile/harness/cycle-ZE-spain-france-cashout-fresh/`

## Result

Pass.

- Home showed the backend-owned `Spain vs. France` event.
- Event Detail loaded backend markets.
- Buy flow submitted and reached Portfolio.
- Portfolio position appeared.
- Portfolio Cash out opened close-position SELL ticket mode.
- Cashout Max used owned shares, not wallet balance.
- No Yes/No selector appeared in close-position cashout mode.
- SELL submitted.
- Portfolio History showed the cashout/sell activity.

## Cashout Assertions

- `cashoutTicketIsClosePositionMode = true`
- `cashoutMaxUsesOwnedShares = true`
- `cashoutTicketHidesYesNoSelector = true`
- `cashoutSellSubmitted = true`
- `cashoutHistoryVisible = true`

The proof harness also failed if wallet-sized cashout amounts such as `9000 USDT`, `9,000 USDT`, `10000 USDT`, or `10,000 USDT` appeared after tapping Max.

## Gaps

- P0: none for the tested Spain vs France buy -> Portfolio -> cashout Max -> sell -> History path.
- P1: proof uses current backend-owned sportsbook event data with cached/no-quota provider state. Live provider refresh remains explicit and quota-gated.
- P1: advance-market maker liquidity remains separate from this tested totals-line flow.

# Cycle YM - Spain vs. France Fresh S23 Cashout Proof

Date: 2026-07-13

## Scope

Fresh S23 proof from current `main` for the internal tester trading flow on the backend-owned Odds API event:

- Home shows `Spain vs. France`.
- Event Detail loads backend markets.
- Buy flow submits a fake-token order for `Over 2.5`.
- Portfolio shows the resulting position.
- Cash out opens close-position mode, not the generic buy ticket.
- Max uses owned position shares only, not wallet balance.
- No Yes/No selector appears while closing the existing position.
- Cashout sell submits and Portfolio History updates.

## Evidence

- Summary: `docs/mobile/harness/cycle-YM-spain-france-cashout-fresh/cycle-YM-SPAIN-FRANCE-CASHOUT-FRESH-odds-api-s23-visible-flow.json`
- Cashout ticket XML: `docs/mobile/harness/cycle-YM-spain-france-cashout-fresh/cycle-YM-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket.xml`
- Cashout Max XML: `docs/mobile/harness/cycle-YM-spain-france-cashout-fresh/cycle-YM-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.xml`
- Cashout Max screenshot: `docs/mobile/screenshots/cycle-YM-spain-france-cashout-fresh/cycle-YM-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.png`
- Portfolio History screenshot: `docs/mobile/screenshots/cycle-YM-spain-france-cashout-fresh/cycle-YM-SPAIN-FRANCE-CASHOUT-FRESH-portfolio-history.png`

## Result

Pass.

Key assertions from the S23 proof:

- `cashoutTicketIsClosePositionMode = true`
- `cashoutMaxUsesOwnedShares = true`
- `cashoutTicketHidesYesNoSelector = true`
- `cashoutSellSubmitted = true`
- `cashoutHistoryVisible = true`

Cashout Max displayed `43.1 SHARES`, with `43.1 shares available at 58%`. The proof rejected wallet-sized cashout values such as `9,000 USDT`, `9000 USDT`, `10,000 USDT`, and `10000 USDT`.

## Validation

- Mobile typecheck: pass.
- Focused mobile cashout/portfolio tests: pass.
- Focused backend cashout/open-orders tests: pass.
- S23 device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.

## Remaining Gaps

- P0: none for the tested Spain vs. France buy -> Portfolio -> cashout -> History flow.
- P1: provider lifecycle is still stale unless the refresh runtime is intentionally started.
- P2: the app remains in Expo/manual tester runtime rather than a production Android build.

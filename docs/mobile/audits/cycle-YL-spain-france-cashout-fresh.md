# Cycle YL - Spain vs. France Fresh S23 Cashout Proof

Date: 2026-07-13

## Scope

Fresh S23 proof from current `main` that the internal tester flow for the backend-owned Odds API event still works after a clean Expo cache reload:

- Home shows `Spain vs. France`.
- Event Detail loads backend markets.
- Buy flow fills a fake-token order for `Over 2.5`.
- Portfolio shows the resulting position.
- Cash out opens close-position mode, not the generic buy ticket.
- Max uses owned shares only, not wallet balance.
- No Yes/No selector appears in cashout mode.
- Cashout sell submits and Portfolio History updates.

## Evidence

- Summary: `docs/mobile/harness/cycle-YL-spain-france-cashout-fresh/cycle-YL-SPAIN-FRANCE-CASHOUT-FRESH-odds-api-s23-visible-flow.json`
- Cashout ticket XML: `docs/mobile/harness/cycle-YL-spain-france-cashout-fresh/cycle-YL-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket.xml`
- Cashout Max XML: `docs/mobile/harness/cycle-YL-spain-france-cashout-fresh/cycle-YL-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.xml`
- Cashout Max screenshot: `docs/mobile/screenshots/cycle-YL-spain-france-cashout-fresh/cycle-YL-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.png`
- Portfolio History screenshot: `docs/mobile/screenshots/cycle-YL-spain-france-cashout-fresh/cycle-YL-SPAIN-FRANCE-CASHOUT-FRESH-portfolio-history.png`

## Result

Pass.

Key assertions from the S23 proof:

- `cashoutTicketIsClosePositionMode = true`
- `cashoutMaxUsesOwnedShares = true`
- `cashoutTicketHidesYesNoSelector = true`
- `cashoutSellSubmitted = true`
- `cashoutHistoryVisible = true`

The generated proof explicitly rejects wallet-sized cashout amounts such as `9,000 USDT`, `9000 USDT`, `10,000 USDT`, and `10000 USDT`.

## Remaining Gaps

- P0: none for the tested Spain vs. France buy -> Portfolio -> cashout -> History flow.
- P1: provider lifecycle is still stale unless the refresh runtime is intentionally started.
- P2: the app remains in Expo/manual tester runtime rather than a production Android build.

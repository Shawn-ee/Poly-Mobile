# Cycle CASHOUTS23B - Spain vs France Cashout Close-Position Proof

Date: 2026-07-13

## Scope

Local MVP internal tester flow for the current backend-owned Odds API event:

Home -> Spain vs France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio -> Cash out -> Max -> Swipe cash out -> History.

No order book, chat, live stats, schema, or unrelated UI work was included.

## Finding

The fresh S23 proof first showed that cashout ticket mode was correct, but the sell did not fill. Max used owned shares (`43.1` shares), not wallet balance, and the ticket hid the Yes/No selector. The failure was stale cashout pricing: the ticket used the position display/current price instead of the latest executable bid, so the SELL posted as an open order.

## Fix

Portfolio cashout now fetches the latest quote for the owned `marketId/outcomeId` before opening the close-position ticket in server mode. The ticket uses that bid as `selection.limitPrice`, carries it into the order payload, and refreshes the ticket outcome quote display.

## Evidence

- S23 device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`
- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Market: `Total Goals`, line `2.5`, outcome `Over`
- Proof summary: `docs/mobile/harness/cycle-CASHOUTS23B-spain-france-cashout/cycle-CASHOUTS23B-odds-api-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-CASHOUTS23B-spain-france-cashout/`
- UI hierarchy: `docs/mobile/harness/cycle-CASHOUTS23B-spain-france-cashout/`

## Acceptance Result

| Check | Result |
| --- | --- |
| Home shows backend-owned Spain vs France event | Pass |
| Event Detail markets load from backend | Pass |
| Buy flow works | Pass |
| Portfolio position appears | Pass |
| Cashout opens close-position ticket | Pass |
| Cashout Max uses owned shares only | Pass |
| No Yes/No selector appears in cashout mode | Pass |
| Swipe cashout submits SELL for owned market/outcome | Pass |
| Portfolio History shows sold activity | Pass |
| Wallet-sized `$9000` cashout amount is absent | Pass |

## Remaining Gaps

- P0: none for this local internal tester cashout path.
- P1: broader cashout quote preview/policy can become a dedicated route later.
- P2: visual polish for the Portfolio history landing remains outside this cycle.

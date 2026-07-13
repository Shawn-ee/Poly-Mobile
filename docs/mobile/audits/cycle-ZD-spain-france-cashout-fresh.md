# Cycle ZD - Spain vs France Cashout Fresh S23 Proof

Date: 2026-07-13

## Scope

Fresh internal tester proof from current `main` for the current backend-owned Odds API event:

Home -> Spain vs France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio -> Cash out -> Max -> Swipe cash out -> History.

No order book, chat, live stats, social, backend schema, provider scan, or unrelated UI work was included.

## Result

Pass on Samsung S23 `SM-S911U1` using device `172.16.200.27:44029`.

The proof specifically checks the real phone path that previously failed: Portfolio Cash out opens close-position mode, hides the generic Yes/No selector, Max uses owned shares only, and the UI does not show wallet-sized cashout amounts such as `9,000 USDT` or `10,000 USDT`.

## Evidence

- Proof summary: `docs/mobile/harness/cycle-ZD-spain-france-cashout-fresh/cycle-ZD-SPAIN-FRANCE-CASHOUT-FRESH-odds-api-s23-visible-flow.json`
- Cashout ticket XML: `docs/mobile/harness/cycle-ZD-spain-france-cashout-fresh/cycle-ZD-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.xml`
- Cashout ticket screenshot: `docs/mobile/screenshots/cycle-ZD-spain-france-cashout-fresh/cycle-ZD-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.png`
- Portfolio history screenshot: `docs/mobile/screenshots/cycle-ZD-spain-france-cashout-fresh/cycle-ZD-SPAIN-FRANCE-CASHOUT-FRESH-portfolio-history.png`

## Acceptance

| Check | Result |
| --- | --- |
| Home shows backend-owned Spain vs France event | Pass |
| Event Detail markets load from backend | Pass |
| Buy flow works | Pass |
| Portfolio position appears | Pass |
| Cashout opens close-position ticket | Pass |
| Cashout Max uses owned shares only | Pass |
| Cashout displays shares, not wallet cash | Pass |
| No Yes/No selector appears in cashout mode | Pass |
| Swipe cashout submits SELL for owned market/outcome | Pass |
| Portfolio History shows sold activity | Pass |
| Wallet-sized cashout amount is absent | Pass |

## Remaining Gaps

- P0: none for this internal tester cashout path.
- P1: a dedicated backend close-position quote route would make proceeds previews more explicitly server-owned.
- P2: Portfolio/history visual polish remains outside this cashout proof cycle.

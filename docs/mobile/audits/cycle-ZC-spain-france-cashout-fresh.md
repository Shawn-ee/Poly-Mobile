# Cycle ZC - Spain vs France Fresh Cashout Proof

Date: 2026-07-13

## Scope

Internal tester mobile trading flow for the current backend-owned Odds API event:

Home -> Spain vs France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio -> Cash out -> Max -> Swipe cash out -> History.

No order book, chat, live stats, social, schema, or unrelated UI work was included.

## Result

Pass on Samsung S23 after a clean Expo Go state reset and fresh bundle launch.

The earlier phone concern was specifically checked: Portfolio Cash out opens close-position Trade Ticket mode, Max uses owned shares, and the cashout ticket does not show the generic Yes/No selector. The S23 XML shows `46.3` shares, `cashout-mode-active-true`, `cashout-max-owned-shares`, and no `$9000` or wallet-sized cashout amount.

## Evidence

- Device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`
- Backend: `http://127.0.0.1:3002`
- Mobile API: `http://172.16.200.14:3002`
- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Market: `Total Goals`, line `2.5`, outcome `Over 2.5`
- Proof summary: `docs/mobile/harness/cycle-ZC-spain-france-cashout-fresh/cycle-ZC-SPAIN-FRANCE-CASHOUT-FRESH-odds-api-s23-visible-flow.json`
- Cashout XML: `docs/mobile/harness/cycle-ZC-spain-france-cashout-fresh/cycle-ZC-SPAIN-FRANCE-CASHOUT-FRESH-cashout-ticket-ready.xml`
- Screenshots: `docs/mobile/screenshots/cycle-ZC-spain-france-cashout-fresh/`

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
| Wallet-sized `$9000` cashout amount is absent | Pass |

## Remaining Gaps

- P0: none for this internal tester cashout path.
- P1: broader cashout preview policy can become a dedicated backend quote/close route.
- P2: visual polish for Portfolio/history remains outside this cycle.

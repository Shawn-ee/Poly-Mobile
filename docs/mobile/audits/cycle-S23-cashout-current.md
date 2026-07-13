# Cycle S23CASHOUTCURRENT - Spain vs France Cashout Reproof

Date: 2026-07-13

## Scope

Fresh Samsung S23 proof from current `main` for the internal tester flow:

Home -> Spain vs France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio -> Cash out -> Max -> Swipe cash out -> History.

No order book, chat, live stats, social, backend schema, or unrelated UI work was included.

## Result

Pass on Samsung S23. The phone used the current Expo bundle after a clean state reset and backend/server-mode launch.

The observed cashout bug did not reproduce in this proof. Portfolio Cash out opened the close-position Trade Ticket, not the generic buy ticket. Max used owned shares only, not wallet balance.

## Evidence

- Device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`
- Backend: `http://127.0.0.1:3002`
- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Market: `Total Goals`, line `2.5`, outcome `Over 2.5`
- Proof summary: `docs/mobile/harness/cycle-S23-cashout-current/cycle-S23CASHOUTCURRENT-odds-api-s23-visible-flow.json`
- Cashout ready XML: `docs/mobile/harness/cycle-S23-cashout-current/cycle-S23CASHOUTCURRENT-cashout-ticket-ready.xml`
- Screenshots: `docs/mobile/screenshots/cycle-S23-cashout-current/`

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
| Selling more than owned shares is blocked by the shared cashout guard | Pass by existing focused tests; not manually over-entered in this S23 run |
| Swipe cashout submits SELL for owned market/outcome | Pass |
| Portfolio History shows sold activity | Pass |

## Phone Proof Details

Cashout ready XML includes:

- `cashout-mode-active-true`
- `cashout-source-position-present`
- `cashout-effective-side-sell`
- `cashout-available-shares-43.100000`
- `cashout-max-owned-shares`
- `cashout-share-quantity-display`
- Visible amount text: `43.1`
- Visible helper text: `43.1 shares available at 58%`
- Visible line: `Odds 58% | 43.1 shares available`

The proof summary records:

- `cashoutTicketOpened=true`
- `cashoutTicketIsClosePositionMode=true`
- `cashoutMaxUsesOwnedShares=true`
- `cashoutTicketHidesYesNoSelector=true`
- `cashoutSellSubmitted=true`
- `cashoutHistoryVisible=true`

## Remaining Gaps

- P0: none for this internal tester cashout path.
- P1: a dedicated backend cashout preview route would make proceeds/price display easier to audit.
- P2: Portfolio/history visual polish remains outside this proof.

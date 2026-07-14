# Cycle ODDSAPIS23 - Spain vs France Cashout Current S23 Proof

## Scope

Internal tester mobile flow for the backend-owned Odds API event:

Home -> Spain vs. France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio -> Cash out -> Max -> Swipe cash out -> History.

## Result

Pass on Samsung S23.

- Device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`
- Backend: `http://127.0.0.1:3002`
- Mobile API base: `http://172.16.200.14:3002`
- Event slug: `odds-api-single-soccer-test`
- Event title: `Spain vs. France`

## Evidence

- Summary: `docs/mobile/harness/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23-odds-api-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-ODDSAPIS23-odds-api-s23-visible-flow/`
- UI hierarchy: `docs/mobile/harness/cycle-ODDSAPIS23-odds-api-s23-visible-flow/`

## Cashout Contract Proof

The S23 cashout path opened the close-position ticket, not the generic buy ticket.

- Selected market: Total Goals 2.5
- Selected outcome: Over 2.5
- Cashout sell/bid price: `0.58`
- Visible Max amount: `43.1 SHARES`
- Available amount source: owned position shares
- Wallet-sized amount such as `$9000` or `$10,000` was not used for Max
- Yes/No selector was absent in cashout mode
- Submit path: server-backed `SELL` for the owned market/outcome
- Post-sell state: Portfolio History shows sell activity for the same sportsbook-backed line
- History side label follows the contract side, so closing an owned Yes position is shown as `Sold Yes Over 2.5 total goals` instead of treating every sell as `No`

## Assertions

| Check | Result |
| --- | --- |
| Home shows Spain vs. France from backend data | Pass |
| Event Detail loads backend Game Lines | Pass |
| Sportsbook-backed Total Goals 2.5 line is visible | Pass |
| Buy ticket preserves market/line/outcome identity | Pass |
| Buy flow places a fake-token server-backed order | Pass |
| Portfolio position appears with the same line identity | Pass |
| Cash out opens close-position mode | Pass |
| Max uses owned shares, not wallet balance | Pass |
| No Yes/No selector appears in cashout mode | Pass |
| Swipe cashout submits SELL | Pass |
| Portfolio History updates after sell | Pass |

## Remaining Gaps

- P0: none for the internal tester Spain vs France cashout path.
- P1: cashout preview can later use a richer dedicated close-position quote/fee/slippage endpoint.
- P2: proof still runs through Expo Go; a development build/APK remains better for repeated tester sessions.

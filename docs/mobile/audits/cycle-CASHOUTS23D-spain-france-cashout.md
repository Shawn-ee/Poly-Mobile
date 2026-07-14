# Cycle CASHOUTS23D - Spain vs France Cashout S23 Proof

## Scope

Internal tester mobile flow for the current backend-owned Odds API event:

Home -> Spain vs. France -> Event Detail -> Total Goals 2.5 -> Buy Over -> Portfolio -> Cash out -> Max -> Swipe cash out -> History.

## Result

Pass on Samsung S23 (`SM-S911U1`, adb device `172.16.200.27:44029`).

## Evidence

- Summary: `docs/mobile/harness/cycle-CASHOUTS23D-spain-france-cashout/cycle-CASHOUTS23D-odds-api-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-CASHOUTS23D-spain-france-cashout/`
- UI hierarchy: `docs/mobile/harness/cycle-CASHOUTS23D-spain-france-cashout/`

## Cashout Contract Proof

The cashout ticket opened in close-position mode, not the generic buy ticket.

- `sourcePositionId`: present
- `closePosition.availableShares`: `43.100000`
- sell price: `0.58`
- selected market/outcome: Total Goals, Over 2.5
- visible amount after Max: `43.1` shares
- visible proceeds: `$25`
- wallet-sized amount such as `$9000` or `10,000 USDT available`: absent from the cashout ticket
- Yes/No selector: absent in cashout mode
- submit path: server-backed `SELL` for the owned market/outcome
- post-sell state: Portfolio History shows sold activity

## Assertions

| Check | Result |
| --- | --- |
| Home shows Spain vs. France from backend data | Pass |
| Event Detail loads backend Game Lines | Pass |
| Buy flow places a fake-token server-backed order | Pass |
| Portfolio position appears | Pass |
| Cash out opens close-position ticket | Pass |
| Max uses owned shares, not wallet balance | Pass |
| No Yes/No selector appears in cashout mode | Pass |
| Swipe cashout submits SELL | Pass |
| Portfolio History updates after sell | Pass |
| Wallet-sized cashout amount is impossible in this proof | Pass |

## Remaining Gaps

- P0: none for the internal tester Spain vs France cashout path.
- P1: cashout preview can be made richer later with a dedicated close-position quote endpoint.
- P2: proof still uses deterministic local maker liquidity for the cashout bid.

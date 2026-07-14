# Cycle S23CASHOUTMAX - Close-Position Max Proof

Generated: 2026-07-14T09:09:53.8528651-05:00

Scope: focused S23 proof that Portfolio cashout opens the close-position ticket and that `Max` uses owned shares, not wallet balance.

## Device And Runtime

- Device: Samsung S23 `SM-S911U1`
- ADB device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Runtime: Expo Go with local backend on `127.0.0.1:3002`
- Event: `Spain vs. France`
- Event slug: `odds-api-single-soccer-test`
- Market: `Total Goals 2.5`
- Outcome: `Over 2.5`
- Mobile auth: local fake-token mobile credential only; token redacted and not persisted in this proof.

## S23 Evidence

The phone was left on the cashout ticket after tapping Portfolio position `Cash out`, then tapping `Max`.

Observed accessibility/runtime markers from the current S23 UI hierarchy:

- `cashout-mode-active-true`
- `cashout-source-position-present`
- `cashout-ticket-no-yes-no-selector`
- `ticket-order-mode-sell`
- `cashout-available-shares-2.000000`
- visible unit: `SHARES`
- visible amount after `Max`: `2`
- visible proceeds: `Estimated proceeds $1.16`
- visible submit label: `Swipe to cash out`

## Acceptance Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Cash out opens close-position mode, not buy mode | Pass | `cashout-mode-active-true`, `ticket-order-mode-sell` |
| Close-position ticket is tied to an existing position | Pass | `cashout-source-position-present` |
| Max uses owned shares only | Pass | `cashout-available-shares-2.000000`, amount `2`, unit `SHARES` |
| Max does not use wallet balance | Pass | No wallet-sized amount such as `$9000` / `$10000`; amount remained `2` shares |
| Yes/No selector is hidden in cashout mode | Pass | `cashout-ticket-no-yes-no-selector` |
| Estimated proceeds are based on sell price and shares | Pass | `Estimated proceeds $1.16` for 2 shares |
| Submit path is sell/cashout-specific | Pass | `Swipe to cash out`, `ticket-order-mode-sell` |

## Routes And Data Contract

- `GET /api/portfolio`: supplies owned position identity and shares.
- `GET /api/portfolio/cash-out/estimate`: supplies close-position sell estimate.
- `GET /api/markets/:marketId/quote`: supplies current bid/sell price.
- `POST /api/orders`: close-position submit must send `side=SELL`, the owned `marketId`, the owned `outcomeId`, selected share quantity, and current sell/bid price.

## Result

P0 cashout-Max regression is not reproducible on the current S23 runtime. The real phone ticket uses owned shares and close-position mode.

Remaining risk: this proof stops at the armed ticket state so the user can manually verify the visible UI before submitting. Full submit/history proof remains covered by Cycle ZBO and should be repeated if the user reports another phone-side mismatch.

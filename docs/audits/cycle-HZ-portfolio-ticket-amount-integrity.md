# Cycle HZ - Portfolio Ticket Amount Integrity

## Scope

Local MVP server-backed fake-token flow:

`Event Detail -> Totals line market -> $75 Buy ticket -> swipe submit -> Portfolio Positions -> Portfolio History`

No order book UI, chat, live stats, social features, deposits, withdrawals, or runtime backend route changes are in scope.

## Problem

After Cycle HY, the reference-style ticket proof entered `$75`, but the deterministic counterparty seed only exposed `60` ask shares. The backend then correctly returned a partial filled position with `27.6 USDT` cost basis at `46%`, but that was a poor Local MVP retail flow because the user saw a `$75` ticket and then a much smaller Portfolio position.

## Acceptance Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| The route-backed totals proof must seed enough deterministic ask liquidity to fully fill the `$75` ticket. | P0 | Passed |
| Portfolio must show the submitted ticket amount as the filled position cost after the server-backed fake-token order. | P0 | Passed |
| The proof must fail if Portfolio shows the old partial-fill amount. | P0 | Passed |
| Selected market type, line, period, provider source, and provider token must remain preserved through Portfolio and History. | P0 | Passed |
| No backend route/schema/order contract changes are required. | P0 | Passed |

## Implementation

- `scripts/local-mvp-route-server-filled-totals-proof.ps1` now seeds three normal `60`-share asks for the totals market.
- `scripts/local-mvp-route-server-filled-team-total-proof.ps1` mirrors the same liquidity setup for the team-total proof family.
- `scripts/smoke.ps1` now asserts `Cost 75 USDT` in the server-filled Portfolio proof.

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Result: pass
- Screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HZ-portfolio-ticket-amount-integrity-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-portfolio.png`
- Summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HZ-portfolio-ticket-amount-integrity-s23-proof-final\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Remaining Gaps

- P2: the liquidity is deterministic proof liquidity, not organic user liquidity.

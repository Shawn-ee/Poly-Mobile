# Trade Ticket Polymarket Audit

Status: template ready. Must be completed before any ticket behavior is marked complete.

## Scope

- Buy/Sell switching.
- Outcome and line carry-through.
- Amount entry and keypad behavior.
- Odds/probability updates.
- Cost, payout, profit, fees if present.
- Confirmation interaction, including swipe/press patterns if present.
- Error, disabled, loading, and insufficient-balance states.
- Post-submit order/portfolio/history effects.

## Reference Audit

Reference device:

Polymarket app/browser:

Route or URL if available:

Screenshots/UI hierarchy:

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Open ticket from game-page primary button | Pending | Pending | Pending |
| Open ticket from market row | Pending | Pending | Pending |
| Switch Buy/Sell | Pending | Pending | Pending |
| Enter amount | Pending | Pending | Pending |
| Change outcome/line before ticket | Pending | Pending | Pending |
| Try submit/confirmation pattern without real trade completion | Pending | Pending | Pending |
| Trigger validation/error state safely | Pending | Pending | Pending |

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| TT-P0-01 | P0 | Ticket opens from every Polymarket-equivalent entry point and carries selected market/outcome/line. | Device smoke/state proof | Pending |
| TT-P0-02 | P0 | Buy/Sell state changes update labels, calculations, and available actions correctly. | Device smoke/unit test | Pending |
| TT-P0-03 | P0 | Amount entry updates cost, payout, shares, and validation state without stale data. | Device smoke/unit test | Pending |
| TT-P0-04 | P0 | Submit/confirmation interaction is not a dead button and matches Polymarket's safety model as closely as possible without real-money actions. | Device smoke | Pending |
| TT-P0-05 | P0 | Post-submit Holiwyn state updates ticket, portfolio/open orders/activity consistently. | Device smoke/backend test | Pending |
| TT-P1-01 | P1 | Ticket visual hierarchy and motion match Polymarket closely. | Screenshot/manual audit | Pending |

## Audit Gate

Result:

Unresolved P0 gaps:

Remaining P1/P2 gaps:

Recommended next cycle:

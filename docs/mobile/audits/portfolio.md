# Portfolio Polymarket Audit

Status: template ready. Must be completed before portfolio behavior is marked complete.

## Scope

- Positions.
- Open orders.
- Cancel behavior.
- Activity/history.
- Sell, close, cash out, or retrade behavior where Polymarket exposes it.
- Balance/fake-token display in Holiwyn, while real-money wallet actions remain out of scope.

## Reference Audit

Reference device:

Polymarket app/browser:

Route or URL if available:

Screenshots/UI hierarchy:

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Open portfolio | Pending | Pending | Pending |
| Open a position | Pending | Pending | Pending |
| Open an order | Pending | Pending | Pending |
| Cancel an order if safe/non-real | Pending | Pending | Pending |
| Open activity/history | Pending | Pending | Pending |
| Tap sell/close/retrade without submitting real trade | Pending | Pending | Pending |

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| PF-P0-01 | P0 | Portfolio shows positions, open orders, activity/history, and balance in a hierarchy comparable to Polymarket. | Screenshot comparison | Pending |
| PF-P0-02 | P0 | Open order cancel is functional when Holiwyn shows a cancel control. | Device smoke/API test | Pending |
| PF-P0-03 | P0 | Position sell/close/retrade entry points either work or are explicitly disabled with clear state. | Device smoke | Pending |
| PF-P0-04 | P0 | Ticket/order/portfolio/history data remain consistent after a Holiwyn order. | Device smoke/API test | Pending |
| PF-P1-01 | P1 | Portfolio visual density and activity detail approach Polymarket. | Screenshot/manual audit | Pending |

## Audit Gate

Result:

Unresolved P0 gaps:

Remaining P1/P2 gaps:

Recommended next cycle:

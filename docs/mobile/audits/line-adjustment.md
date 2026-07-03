# Line Adjustment Polymarket Audit

Status: template ready. Must be completed before any adjustable line market is marked complete.

## Scope

Audit line-based markets:

- Spreads/handicaps.
- Totals/over-under.
- Team totals.
- Corners.
- First half and second half line markets.
- Other discovered line-based markets.

## Reference Audit

Reference device:

Polymarket app/browser:

Route or URL if available:

Screenshots/UI hierarchy:

| Market type | Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- | --- |
| Spread | Change line | Pending | Pending | Pending |
| Total | Change line | Pending | Pending | Pending |
| Team total | Change line | Pending | Pending | Pending |
| Corners | Discover/change line | Pending | Pending | Pending |
| Half market | Discover/change line | Pending | Pending | Pending |
| Other discovered | Discover/change line | Pending | Pending | Pending |

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LA-P0-01 | P0 | Polymarket line selector behavior is audited for each supported line market before Holiwyn completion. | Reference audit | Pending |
| LA-P0-02 | P0 | Holiwyn exposes selectable line sets where Polymarket exposes selectable line sets. | Screenshot/device smoke | Pending |
| LA-P0-03 | P0 | Changing a line updates row prices/probabilities and selected market identity. | Device smoke/state test | Pending |
| LA-P0-04 | P0 | Ticket preserves changed line, market type, and outcome. | Device smoke | Pending |
| LA-P0-05 | P0 | Portfolio/open order/history preserve changed line identity after order. | Device smoke/API test | Pending |
| LA-P1-01 | P1 | Long-tail line markets discovered in Polymarket are prioritized and tracked. | Gap tracker | Pending |

## Audit Gate

Result:

Unresolved P0 gaps:

Remaining P1/P2 gaps:

Recommended next cycle:

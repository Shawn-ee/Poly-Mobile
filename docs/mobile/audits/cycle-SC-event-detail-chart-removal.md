# Cycle SC - Event Detail Chart Removal Hardening

## Scope

Local MVP Event Detail page only. This cycle removes the dormant market-page chart renderer so the tester-facing flow stays focused on:

Home -> Event Detail -> line market -> Buy/Sell ticket -> fake-token order -> Portfolio/history.

## Reference / Product Direction

- The current Local MVP direction explicitly removes chart complexity from the market page.
- Order book, chat, live stats, and social features remain out of default user scope.
- The Event Detail page should prioritize compact match identity, outcome buttons, Game Lines, line selectors, ticket handoff, and Portfolio/history.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | `EventDetail.tsx` must not contain the old market-page probability chart renderer. | Pass |
| P0 | Event Detail must not expose chart route-state UI, chart point chips, or chart ticket handoff controls. | Pass |
| P0 | S23 proof must fail if `event-detail-price-chart`, `event-detail-chart-route-state`, or `Chart selection` returns to visible Event Detail XML. | Implemented in proof script |
| P0 | The normal line-market ticket/order/Portfolio journey must still pass on S23. | Pass |
| P1 | Real provider-backed current-match line markets should replace contract fixtures when available. | Open |

## Implementation Notes

- Removed the dormant `renderProbabilityChart` function.
- Removed chart point state and chart source/status helpers.
- Removed chart-specific styles from `EventDetail.tsx`.
- Updated chart contract tests to assert the Local MVP Event Detail page stays chart-free.
- Updated S23 visible-flow proof assertions to reject chart markers in Event Detail top and line views.

## Backend / Data Contract Notes

- No backend route changed.
- Existing chart-history route data can remain internal infrastructure.
- Visible Local MVP Event Detail no longer depends on chart history data.

## Audit Gate

- Unit/type validation: passed.
- Android proof: passed on Samsung S23 `SM-S911U1`.
- Proof summary: `docs/mobile/harness/cycle-SC-event-detail-chart-removal/cycle-SC-current-mvp-s23-visible-flow.json`.
- Key screenshots: `docs/mobile/screenshots/cycle-SC-event-detail-chart-removal/cycle-SC-current-mvp-detail-top.png`, `docs/mobile/screenshots/cycle-SC-event-detail-chart-removal/cycle-SC-current-mvp-lines.png`, `docs/mobile/screenshots/cycle-SC-event-detail-chart-removal/cycle-SC-current-mvp-line-cashout-history.png`.
- Unresolved P0: 0 for SC scope.

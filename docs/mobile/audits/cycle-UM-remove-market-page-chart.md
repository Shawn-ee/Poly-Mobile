# Cycle UM - Remove Market Page Chart Harness Debt

Status: source/harness contract pass; Android proof pending because no ADB device is attached.

## Scope

User direction: remove the Polymarket chart from the market/Event Detail page because it is too complicated for the current Local MVP.

This cycle keeps the Local MVP focused on:

- Home/Live -> Event Detail
- probability/outcome display
- Game Lines / line selectors
- simple Buy/Sell ticket
- fake-token order
- Portfolio/history

Out of scope: order book UI, chat, live stats, social features, backend schema changes, and chart-history provider work.

## Reference / Current-State Audit

- `mobile/src/components/EventDetail.tsx` is already chart-free: no `renderProbabilityChart`, `event-detail-price-chart`, chart point selector, chart filter, chart tooltip, or chart ticket handoff exists in the component.
- Current Local MVP criteria already require absence of `event-detail-price-chart`.
- The stale gap was in `mobile/scripts/smoke.ps1`: several older proof modes still positively expected or tapped chart controls even though the app no longer renders them.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| UM-P0-01 | P0 | Event Detail source must not render a market-page chart or chart controls. | Pass |
| UM-P0-02 | P0 | Mobile proof harness must not require `event-detail-price-chart` through `Assert-HierarchyContains`. | Pass |
| UM-P0-03 | P0 | Mobile proof harness must not tap `event-detail-chart-*` controls. | Pass |
| UM-P0-04 | P0 | Harness paths that previously checked charts must instead assert chart absence or continue through Game Lines. | Pass |
| UM-P0-05 | P0 | No backend/order/schema behavior changes. | Pass |

## Implementation Notes

- Updated `mobile/scripts/smoke.ps1` so chart-specific proof paths assert chart absence instead of expecting chart controls.
- Updated `mobile/src/__tests__/eventDetailChartInteractionContract.test.ts` to guard both Event Detail source and the smoke harness.
- Left backend chart-history fields and provider contracts untouched as internal/future data. They are not default market-page UI.

## Proof

- Source search: Event Detail source has no market-page chart renderer or chart UI markers.
- Contract test: `mobile/src/__tests__/eventDetailChartInteractionContract.test.ts`.
- Android proof: not run; `adb devices -l` showed no attached device.

## Remaining Gaps

- P1: Run S23 visible proof once the device is attached to confirm Event Detail top/lines XML does not include chart markers.
- P1: Full visible Local MVP journey proof remains needed after the next S23 connection.

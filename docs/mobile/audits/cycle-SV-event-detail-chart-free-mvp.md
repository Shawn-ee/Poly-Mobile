# Cycle SV - Event Detail Chart-Free MVP Cleanup

## Scope

Local MVP Event Detail market page.

Out of scope: order book UI, chat, live stats, social features, backend schema changes, chart-history provider work, and new ticket/order behavior.

## Product Direction

User direction for the Local MVP is to remove the Polymarket-style chart from the market page because it is too complicated for the current app. The default mobile flow should stay focused on Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token order -> Portfolio/history.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Event Detail source contains no chart renderer or selected chart-point state. | Pass |
| P0 | Event Detail source contains no user-facing chart status/source copy. | Pass |
| P0 | Event Detail keeps outcome buttons, Game Lines, line selector, ticket handoff, and Portfolio flow intact. | Pass |
| P0 | No backend/order route or schema behavior changes. | Pass |
| P0 | Samsung S23 proof covers the current MVP route and verifies chart markers do not return. | Pass |

## Implementation Notes

- Component: `mobile/src/components/EventDetail.tsx`.
- Tests: `mobile/src/__tests__/eventDetailChartInteractionContract.test.ts`, `mobile/src/__tests__/eventDetailChartStatusCopy.test.ts`.
- Change: removed the last unused `liveChartBlock` style after the chart renderer had already been removed in earlier Local MVP chart-removal work.
- Existing S23 proof harness already rejects chart markers such as `event-detail-price-chart`, `event-detail-chart-route-state`, and `Chart selection`.

## Audit Result

P0 pass.

## Android Proof

- Device: Samsung S23 `SM-S911U1`.
- ADB target: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Proof summary: `docs/mobile/harness/cycle-SV-event-detail-chart-free-mvp/cycle-SV-current-mvp-s23-visible-flow.json`.
- Screenshots: `docs/mobile/screenshots/cycle-SV-event-detail-chart-free-mvp/`.
- Result: Pass. The proof reached Home -> Live -> Event Detail -> Game Lines -> Trade Ticket -> Portfolio/history and the harness completed with the chart-free Event Detail checks still active.

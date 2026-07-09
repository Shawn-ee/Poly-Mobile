# Cycle PQ - Event Detail Chart Touch Handoff

Status: P0 Audit Gate passed on Samsung S23.

## Scope

Local MVP visible user flow only:

Home -> Event Detail -> chart/probability -> chart selected point -> Trade Ticket.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, deposit/withdraw, or provider-import breadth.

## Reference Audit

User-provided Polymarket reference and prior chart audit showed that Polymarket chart areas are interactive and expose odds/probability context when touched. Holiwyn had a visible chart, but the current code only toggled the selected primary outcome and did not expose a selected chart-point/readout or a direct chart-to-ticket handoff.

## Acceptance Criteria

| ID | Priority | Criterion | Evidence |
| --- | --- | --- | --- |
| PQ-P0-01 | P0 | Event Detail chart exposes current market/outcome probability context and route/source/status labels. | S23 XML includes `event-detail-price-chart`, `chart-source-fallback`, `chart-status-fallback`, and `chart-range-none`. |
| PQ-P0-02 | P0 | Tapping the chart target changes visible selected-point state from current to target. | S23 XML after tap includes `event-detail-chart-selected-point-target`, `chart-selected-point-target`, and `Target line`. |
| PQ-P0-03 | P0 | Selected chart point shows a tooltip/readout equivalent with probability value. | S23 screenshot/XML includes `event-detail-chart-contract-point`. |
| PQ-P0-04 | P0 | Chart-to-ticket action opens the normal simple Trade Ticket with selected market/outcome identity preserved. | S23 XML includes `event-detail-chart-open-ticket`, then `trade-ticket`, `ticket-selection-summary`, and `swipe-to-submit-order`. |
| PQ-P0-05 | P0 | Order book, chat, and live stats remain hidden in the Local MVP default path. | S23 XML does not include orderbook/chat/live-stats entry labels. |

## Implementation Notes

- `mobile/src/components/EventDetail.tsx` adds `selectedChartPoint`.
- `renderProbabilityChart` now renders Current/Target chips, a selected-point marker, a compact readout, and a Trade button.
- The Trade button calls `openTicket` with `orderBookTicketSelection` for the selected primary market/outcome.
- Chart height was increased to avoid overlap on Samsung S23.

## Backend/API Dependency

- No new backend route or schema change.
- Uses existing event detail/chart data when available.
- Uses existing Trade Ticket submit route only after the user submits.

## Audit Gate

Passed:

- Mobile typecheck: passed.
- Samsung S23 proof device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` (`SM-S911U1`).
- Proof summary: `docs/mobile/harness/cycle-PQ-event-detail-chart-touch-handoff/cycle-PQ-event-detail-chart-touch-handoff-proof.json`.
- Screenshots:
  - `docs/mobile/screenshots/cycle-PQ-event-detail-chart-touch-handoff/cycle-ER-holiwyn-local-mvp-status-top.png`
  - `docs/mobile/screenshots/cycle-PQ-event-detail-chart-touch-handoff/cycle-GB-holiwyn-event-detail-chart-target.png`
  - `docs/mobile/screenshots/cycle-PQ-event-detail-chart-touch-handoff/cycle-GB-holiwyn-event-detail-chart-ticket.png`
  - `docs/mobile/screenshots/cycle-PQ-event-detail-chart-touch-handoff/cycle-ER-holiwyn-local-mvp-status-market-lines.png`

Unresolved P0 gaps for this focused chart handoff scope: 0.

Remaining P1/P2:

- P1: provider-backed chart history for every current-match line market.
- P2: closer native Polymarket drag geometry and timestamp tooltip polish.

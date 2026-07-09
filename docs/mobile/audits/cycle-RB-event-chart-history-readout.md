# Cycle RB - Event Chart History Readout

## Scope

Local MVP Event Detail chart interaction.

The Event Detail chart was tappable, but the selected readout used a synthetic `Target line` probability instead of selecting from the actual chart-history points. This cycle moves the readout closer to Polymarket's press-on-chart behavior by selecting `Earlier`, `Mid`, and `Latest` points from the route-backed chart history when available.

This cycle does not change backend routes, provider ingestion, order logic, ticket submit, Portfolio, order book, chat, live stats, social, deposit, or withdraw behavior.

## Acceptance Criteria

| ID | Priority | Criteria | Evidence |
| --- | --- | --- | --- |
| RB-P0-01 | P0 | Event Detail chart starts on a visible latest point readout. | S23 XML/screenshot. |
| RB-P0-02 | P0 | Tapping the chart changes the selected point to another history point without leaving Event Detail. | S23 XML/screenshot before/after tap. |
| RB-P0-03 | P0 | Chart readout uses actual `event.chartHistory` points when available instead of synthetic `Target line` odds. | Source contract test and S23 XML showing chart history point count. |
| RB-P0-04 | P0 | Chart ticket handoff and selected market/outcome identity remain present. | S23 XML contains `event-detail-chart-contract-point`. |
| RB-P0-05 | P0 | No order book, chat, live stats, backend route, schema, order, deposit, or withdraw code changes. | Git diff and docs. |

## Implementation

- Replaced `current`/`target` chart state with `early`/`mid`/`latest`.
- Filtered chart-history points to the selected outcome when possible.
- The selected readout now uses the selected chart-history point probability and timestamp.
- Kept deterministic fallback points only for events with no chart history.
- Added a focused source contract test for the chart interaction behavior.

## Backend/API Contract

- No backend route changed.
- Existing Event Detail chart fields remain the dependency:
  - `event.chartHistory[].outcomeId`
  - `event.chartHistory[].timestamp`
  - `event.chartHistory[].probability`
  - `event.chartHistorySource`
  - `event.chartHistoryStatus`
  - `event.chartHistoryRange`
  - `event.chartHistoryLastUpdated`

## Audit Gate

Pass.

- Typecheck passed.
- Focused Event Detail chart/no-chat tests passed.
- S23 proof device: Samsung S23 `SM-S911U1`, `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- S23 proof: Event Detail showed `chart-history-points-8`, `chart-selected-point-latest`, and `event-detail-chart-contract-point`; after chart tap it showed `chart-selected-point-mid` and did not show `Target line`.

Evidence:

- Latest XML: `docs/mobile/harness/cycle-RB-event-chart-history-readout/cycle-RB-detail-latest.xml`
- Latest screenshot: `docs/mobile/screenshots/cycle-RB-event-chart-history-readout/cycle-RB-detail-latest.png`
- After-tap XML: `docs/mobile/harness/cycle-RB-event-chart-history-readout/cycle-RB-detail-mid.xml`
- After-tap screenshot: `docs/mobile/screenshots/cycle-RB-event-chart-history-readout/cycle-RB-detail-mid.png`

## Remaining Gaps

- Native drag-nearest-point behavior remains P1; this cycle proves tap-to-cycle history readout, not continuous finger tracking on the chart.
- Real provider-backed Spread/Totals/Team Total line markets remain P1.

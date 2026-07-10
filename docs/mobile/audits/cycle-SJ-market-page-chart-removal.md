# Cycle SJ - Market Page Chart Removal

## Scope

Local MVP Event Detail market page only.

## Polymarket Reference Note

Earlier Polymarket reference audits showed an interactive probability chart on the game page. Product steering changed on July 10, 2026: Holiwyn should remove the Polymarket chart from the market page because it is too complicated for the current Local MVP and distracts from the retail betting path.

## Holiwyn Criteria

### P0

- Event Detail must not render the Polymarket-style probability chart.
- Event Detail must still show the compact match header, primary outcome buttons, Game Lines, Player Props tab placeholder, market rows, line selectors, and ticket entry.
- The mobile app must not fetch `/api/markets/:id/chart` as part of the default market-page runtime.
- Existing backend chart routes may remain internal; they must not block the Local MVP market-page proof.

### P1

- Backend chart-history data can be revisited only after Home -> Event Detail -> ticket -> Portfolio/history is stable.

### P2

- If charts return later, they need a new audit gate and explicit user approval.

## Implementation

- Removed `PolyApi.getMarketChart()` from the mobile API client.
- Removed the unused `marketChartService` and its dedicated test file.
- Kept Event Detail chart-free and changed its generic provider route status helper so it no longer depends on chart-history typing.
- Left backend chart routes untouched as internal infrastructure.

## Audit Gate

Status: passed on Samsung S23.

Expected proof markers:

- `event-detail-price-chart` absent.
- `event-detail-chart-route-state` absent.
- `Chart selection` absent.
- Game Lines and ticket markers still present.

Proof summary:

- `docs/mobile/harness/cycle-SJ-market-page-chart-removal/cycle-SJ-current-mvp-s23-visible-flow.json`
- Device: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`
- Screenshots: `docs/mobile/screenshots/cycle-SJ-market-page-chart-removal/`
- XML hierarchy: `docs/mobile/harness/cycle-SJ-market-page-chart-removal/`

## Remaining Gaps

- P0: none.
- P1: real provider-backed line markets remain separate from chart work.

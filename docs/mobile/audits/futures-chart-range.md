# Futures Chart Range Polymarket Audit

Status: Cycle W P0 pass for the focused futures chart/time-range scope.

## Scope

- World Cup Winner futures chart legend.
- Chart area presence.
- Volume row and time-range controls: `1H`, `1D`, `1W`, `1M`, `MAX`.
- Tappable range state in Holiwyn.

Out of scope:

- Real historical chart data.
- Press/hold tooltip.
- Pixel-level chart line geometry.
- Full Polymarket settings gear behavior.

## Cycle W Reference Audit

Reference device:

- Samsung S23.

Polymarket app/browser:

- Chrome mobile web at Polymarket. The installed Android app remains location-verification blocked.

Route or URL:

- `https://polymarket.com/event/world-cup-winner`

Screenshots/UI hierarchy:

- `docs/mobile/reference/screenshots/cycle-W-polymarket-world-cup-winner-chart-top.png`
- `docs/mobile/reference/screenshots/cycle-W-polymarket-world-cup-winner-chart-top.xml`
- `docs/mobile/reference/screenshots/cycle-W-polymarket-world-cup-winner-chart-1d.png`
- `docs/mobile/reference/screenshots/cycle-W-polymarket-world-cup-winner-chart-1d.xml`
- `docs/mobile/reference/screenshots/cycle-W-polymarket-world-cup-winner-chart-1w.png`
- `docs/mobile/reference/screenshots/cycle-W-polymarket-world-cup-winner-chart-1w.xml`

## Reference Behavior

| Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- |
| Open World Cup Winner event top | Chart area shows top outcome legend, multi-outcome chart, volume row, time ranges, and settings gear. | Event context remains World Cup Winner. | `cycle-W-polymarket-world-cup-winner-chart-top.png` |
| Tap `1D` | Range state changes; chart remains in place with the same event context. | Active range changes. | `cycle-W-polymarket-world-cup-winner-chart-1d.png` |
| Tap `1W` | Range state changes again; chart remains in place with the same event context. | Active range changes. | `cycle-W-polymarket-world-cup-winner-chart-1w.png` |

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| FCR-P0-01 | P0 | Futures card exposes a chart section with top outcome legend and chart area. | Tablet screenshot/XML. | Pass |
| FCR-P0-02 | P0 | Futures chart exposes the same baseline range options: `1H`, `1D`, `1W`, `1M`, `MAX`. | Tablet screenshot/XML. | Pass |
| FCR-P0-03 | P0 | Tapping `1D` and `1W` changes the selected range state without losing the futures rows. | Tablet smoke proof. | Pass |
| FCR-P0-04 | P0 | The feature has same-cycle Polymarket reference evidence and Holiwyn Android proof. | Audit file/proof log. | Pass |
| FCR-P1-01 | P1 | Chart data is real historical backend data per range. | Future API test/device proof. | Deferred |
| FCR-P1-02 | P1 | Settings gear opens a chart settings/display menu matching Polymarket. | Future device proof. | Deferred |
| FCR-P2-01 | P2 | Chart press/hold tooltip, animation, and exact geometry match Polymarket. | Future visual audit. | Deferred |

## Holiwyn Implementation

Frontend components touched:

- `mobile/src/components/MarketLists.tsx`
- `mobile/scripts/smoke.ps1`
- `mobile/scripts/smoke-tablet.ps1`

Important functions/services touched:

- `FutureList()` now owns local `selectedRange` chart state.
- `futureChartRanges` defines `1H`, `1D`, `1W`, `1M`, `MAX`.
- `FutureChartRange` smoke taps `1D` then `1W` and proves the selected state.

State transitions:

- `selectedRange: "MAX" -> "1D"` when tapping `future-chart-range-1d`.
- `selectedRange: "1D" -> "1W"` when tapping `future-chart-range-1w`.
- Futures outcome rows remain visible and tradable after range changes.

Backend/API involvement:

- No backend route is called by this cycle.
- Chart data is local deterministic UI only.
- Future backend work should provide market history series keyed by market id and range.

## Holiwyn Proof

Holiwyn device:

- Samsung tablet running Holiwyn through Expo Go.

Proof commands:

- `npm run typecheck`
- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -FutureChartRange -Port 8194`

Holiwyn evidence:

- `docs/mobile/harness/cycle-current-holiwyn-future-chart-ready.xml`
- `docs/mobile/harness/cycle-current-holiwyn-future-chart-1d.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-future-chart-1w.png`
- `docs/mobile/harness/cycle-current-holiwyn-future-chart-1w.xml`

## Audit Gate

Result:

- Pass for the focused Cycle W chart time-range scope.

Unresolved P0 gaps:

- 0 for this focused scope.

Remaining P1/P2 gaps:

- Real historical chart data per range.
- Chart settings gear behavior.
- Press/hold tooltip and exact chart geometry.

Recommended next cycle:

- Continue into true backend chart history contracts or move to adjustable line markets if a match-specific Polymarket reference page is reachable.

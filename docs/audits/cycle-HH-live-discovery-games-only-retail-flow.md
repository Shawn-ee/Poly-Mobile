# Cycle HH - Live Discovery Games-Only Retail Flow

## Scope

Local MVP live discovery only:

`Live -> live football game card -> Event Detail`

## Polymarket Reference Behavior

The current MVP direction is to keep the Live page focused on live football games and prediction entry. Operational refresh/freshness controls are not part of the default user-facing betting path.

## Holiwyn Acceptance Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Live discovery shows a World Cup live games focus header and live game cards. | P0 | Passed |
| Visible `Updated just now`, `Refresh`, `5 markets`, `11 outcomes`, and `live-market-summary` copy are absent from the default Live page. | P0 | Passed |
| Refresh/count state remains available only as structured hidden proof metadata. | P0 | Passed |
| Tapping the live game card still opens Event Detail. | P0 | Passed |
| Backend/API route must not change for this presentation-only cycle. | P0 | Passed |

## Implementation Notes

- `src/components/LiveScreen.tsx` removes the visible refresh/status row from the default Live page.
- Live operational state now uses `live-operational-controls-hidden-local-mvp` with structured labels such as `market-count-5` and `outcome-count-11`.
- `scripts/smoke.ps1` now rejects the old visible Live summary strings and opens the game card.
- `scripts/smoke-tablet.ps1` now forwards `-LiveSummary` with the requested output folders.
- No event, market, ticket, order, Portfolio, route, schema, or data contract changed.

## Proof

- Device: Samsung tablet `SM_X526C`.
- Final command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LiveSummary -Port 8282 -OutputDir docs/mobile/screenshots/cycle-HH-live-discovery-games-only-retail-flow-final -HierarchyOutputDir docs/mobile/harness/cycle-HH-live-discovery-games-only-retail-flow-final`.
- Result: pass.
- Failed attempts:
  - Port `8280`: hidden metadata still contained old visible strings.
  - Port `8281`: startup wait still expected old visible `5 markets` copy.
- Evidence:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HH-live-discovery-games-only-retail-flow-final\cycle-current-holiwyn-live-summary.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HH-live-discovery-games-only-retail-flow-final\cycle-current-holiwyn-live-summary.xml`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HH-live-discovery-games-only-retail-flow-final\cycle-current-holiwyn-live-summary-detail.png`

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| Future real provider refresh UX can return behind a deliberate backend/provider milestone, not the default Local MVP Live page. | P2 | Tracked |

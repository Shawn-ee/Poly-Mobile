# Cycle HG - Event Detail Retail Market Copy

## Scope

Local MVP live Event Detail only:

`Home -> live Event Detail -> simple outcome ticket -> Game Lines`

## Polymarket Reference Behavior

The Polymarket-style game page keeps market labels simple and user-facing. It does not expose demo/provider-style copy such as "prices moving" in the primary market card.

## Holiwyn Acceptance Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Live Event Detail primary market card shows simple retail copy: `Winner market`. | P0 | Passed |
| Live Event Detail rejects old visible copy: `Live World Cup - prices moving`. | P0 | Passed |
| Live outcome ticket still opens from the top outcome button. | P0 | Passed |
| Game Lines, Spread, Totals, and First Half Winner remain reachable after the copy change. | P0 | Passed |
| Backend/API route must not change for this presentation-only cycle. | P0 | Passed |

## Implementation Notes

- `src/components/EventDetail.tsx` now renders `Winner market` as the Team/Live Winner card subcopy for live and non-live events.
- `scripts/smoke.ps1` asserts the new copy and rejects the old `Live World Cup - prices moving` string in the `-LiveDetail` proof.
- No order, ticket, route, schema, or data contract changed.

## Proof

- Device: Samsung tablet `SM_X526C`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LiveDetail -Port 8279 -OutputDir docs/mobile/screenshots/cycle-HG-event-detail-retail-market-copy -HierarchyOutputDir docs/mobile/harness/cycle-HG-event-detail-retail-market-copy`.
- Result: pass.
- Evidence:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HG-event-detail-retail-market-copy\cycle-current-holiwyn-live-detail-top.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HG-event-detail-retail-market-copy\cycle-current-holiwyn-live-detail-top.xml`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HG-event-detail-retail-market-copy\cycle-current-holiwyn-live-detail-ticket.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HG-event-detail-retail-market-copy\cycle-current-holiwyn-live-detail-markets.png`

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| Exact Polymarket live chart/touch physics remain future polish. | P2 | Tracked |

# Cycle HE - Event Detail Hide Live Provider Copy

## Scope

Local MVP live Event Detail surface. The user-facing path remains `Home/Live -> Event Detail -> live outcome -> simple Buy/Sell ticket -> fake-token order -> Portfolio/history`.

## Criteria

- P0: Live Event Detail should show match identity, score/time, probabilities, chart, and game-line markets without visible backend/provider freshness copy.
- P0: Provider/source/status fields must remain available as hidden proof metadata for route-backed future work.
- P0: A live outcome button must still open the simple Buy/Sell ticket.
- P0: Game Lines, spreads, totals, and first-half markets must remain reachable after the visual cleanup.
- P0: No backend/API route, request body, response field, or schema should change.

## Implementation

- `EventDetail` now keeps `event-detail-live-data-inline` as hidden proof metadata and removes visible `Live provider ready / source` style copy from the default live game page and live match strip.
- `scripts/smoke.ps1` now asserts `event-detail-live-provider-copy-hidden-local-mvp` and rejects visible provider/source copy on the live-detail top screen.
- `scripts/smoke-tablet.ps1` now forwards `OutputDir` and `HierarchyOutputDir` for `-LiveDetail` proof runs.
- The live-detail ticket proof now opens the ticket from the visible top `AUS` outcome button before checking market-line reachability.

## Audit Gate

- Device: Samsung tablet `SM_X526C`.
- Passing command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LiveDetail -Port 8275 -OutputDir docs/mobile/screenshots/cycle-HE-event-detail-hide-live-provider-copy -HierarchyOutputDir docs/mobile/harness/cycle-HE-event-detail-hide-live-provider-copy`.
- Result: Pass.
- First attempt on port `8274` failed because the existing proof tapped a clipped post-scroll outcome row; the product top-screen assertions had already passed. The proof was corrected to tap the visible top outcome button and rerun cleanly.
- Evidence: `cycle-current-holiwyn-live-detail-top.png`, `cycle-current-holiwyn-live-detail-ticket.png`, and `cycle-current-holiwyn-live-detail-markets.png` in the HE proof folder.

## Remaining Gaps

- P1: route-backed provider lifecycle proofs still exist for backend/provider milestones, but default Local MVP users should not see operational provider/source copy.
- P2: exact Polymarket native live chart gesture physics remains future polish.

# Cycle IL - Event Detail Core Lines Order

## Scope

Local MVP visible mobile flow: Home -> Event Detail -> Game Lines -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

This cycle focuses only on the Event Detail Game Lines ordering. It does not touch order book, chat, live stats, social features, deposits, withdrawals, or backend order logic.

## Polymarket Reference Behavior

The mobile soccer game page emphasizes the primary full-game prediction choices before lower-priority detail sections. For the current Holiwyn MVP, full-game spread/totals/team-total choices should be easy to reach before half-specific sections.

## Acceptance Criteria

| Criteria | Priority | Result |
| --- | --- | --- |
| Game Lines shows full-game spread, totals, and team-total groups before first-half or second-half winner sections. | P0 | Pass |
| Half-specific markets may remain available below core full-game lines, but must not dominate the first Game Lines hierarchy. | P0 | Pass |
| Player Props remains a deliberate blank MVP state. | P0 | Pass |
| Returning from Player Props to Game Lines preserves the full-game-before-half hierarchy. | P0 | Pass |
| Totals ticket selection, upward swipe submit, and Portfolio History still work. | P0 | Pass |
| No backend route/schema/order logic changes are introduced. | P0 | Pass |
| Exact Polymarket ordering for every soccer market and native collapse animation. | P2 | Tracked |

## Implementation Notes

- `src/components/EventDetail.tsx`: moved the `team-total-goals` group above `first-half-winner` and `second-half-winner`, and added the proof marker `event-detail-core-full-game-lines-before-halves-local-mvp`.
- `scripts/smoke.ps1`: added S23 hierarchy gates that verify `Full Game Team Total Goals` appears before `1st Half Winner`, including after returning from Player Props.

## API/Data Dependencies

No backend/API change. The existing route-backed path remains:

- Event/market data from the existing mobile event detail state.
- `POST /api/orders` for fake-token order placement.
- `GET /api/portfolio` and Portfolio History state for post-submit proof.

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Result: pass
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8356 -OutputDir docs\mobile\screenshots\cycle-IL-event-detail-core-lines-order-s23-proof-final -HierarchyOutputDir docs\mobile\harness\cycle-IL-event-detail-core-lines-order-s23-proof-final`

Proof artifacts:

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IL-event-detail-core-lines-order-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-line-markets.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IL-event-detail-core-lines-order-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-player-props-blank.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IL-event-detail-core-lines-order-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IL-event-detail-core-lines-order-s23-proof-final\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Audit Gate

Pass. P0 gaps for this cycle are closed. Remaining P2 gap: exact Polymarket ordering across all lower-priority soccer market sections and native expand/collapse animation.

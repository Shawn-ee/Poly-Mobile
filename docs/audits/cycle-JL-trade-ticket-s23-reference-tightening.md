# Cycle JL - Trade Ticket S23 Reference Tightening

## Polymarket Reference

- The reference order screen is a full-screen dark ticket body with close, team/icon, event title, selected outcome, a large centered amount, a `to win` line, odds/available balance, quick presets, and a sparse numeric keypad.
- The submit area is a fixed red/pink footer below the dark ticket body. The dark body has rounded lower corners where it meets the footer.
- The swipe cue sits near the top of the submit footer and visibly travels upward with the gesture. Submission only happens after a clear upward threshold.

## Acceptance Criteria

| Criteria | Priority | Result |
| --- | --- | --- |
| S23 shows the amount, `to win`, odds/balance, presets, and full keypad without the red footer covering the bottom keypad row. | P0 | Pass |
| The dark keypad body and fixed red/pink submit footer remain visually separated, with rounded lower body corners. | P0 | Pass |
| The swipe handle starts above the footer label and is transform-linked to swipe gesture progress. | P0 | Pass |
| Tap does not submit; a threshold upward swipe submits the fake-token/server-backed order. | P0 | Pass |
| Backend/order routes are unchanged. | P0 | Pass |

## Implementation Notes

- Touched `src/components/TradeTicket.tsx` and `scripts/smoke.ps1` only.
- Reduced S23 footer height so the dark body has more usable room for the amount and keypad.
- Kept the footer fixed at the bottom, kept the red/pink treatment, and added explicit proof labels for S23 no-overlap and compact reference footer geometry.
- Tuned handle travel so the chevron visibly lifts upward during the swipe while staying inside the red footer capture on S23.

## Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Result: pass.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8404 -OutputDir docs\mobile\screenshots\cycle-JL-trade-ticket-s23-reference-tightening-proof-final2 -HierarchyOutputDir docs\mobile\harness\cycle-JL-trade-ticket-s23-reference-tightening-proof-final2`.
- Ticket-ready screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JL-trade-ticket-s23-reference-tightening-proof-final2\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`.
- Swipe-progress screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JL-trade-ticket-s23-reference-tightening-proof-final2\cycle-EY-holiwyn-route-server-mvp-totals-ticket-swipe-progress.png`.
- Flow proof summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JL-trade-ticket-s23-reference-tightening-proof-final2\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

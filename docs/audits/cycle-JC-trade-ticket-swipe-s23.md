# Cycle JC - Trade Ticket Swipe Reference Tightening

## Reference behavior

- Polymarket's amount-entry ticket uses a dark full-screen body with close, event identity, selected outcome, large amount, `to win`, odds/balance, presets, and a numeric keypad.
- The submit area is a separate red/pink bottom zone. The dark ticket body has rounded lower corners above it.
- The user swipes upward from the bottom submit zone. The arrow/handle visibly moves upward with the gesture, and submission occurs only after a clear upward threshold.

## Holiwyn criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Dark amount/keypad panel is visually separate from the red/pink swipe zone. | P0 | Pass |
| S23 ticket-ready screen shows amount, `to win`, odds/balance, +$25/+$50/Max presets, and full keypad without overlap. | P0 | Pass |
| Swipe arrow/handle translates upward during gesture progress. | P0 | Pass |
| Swipe submit remains threshold-gated and is not a tap-only submit button. | P0 | Pass |
| Existing server-backed fake-token order path still reaches Portfolio/History. | P0 | Pass |
| Exact native blur/physics and production event/team art. | P2 | Tracked |

## Implementation notes

- Touched `src/components/TradeTicket.tsx` only.
- Added explicit swipe threshold/travel constants.
- Tightened S23 body/footer spacing and removed the oversized armed-state overlay from the footer.
- No backend/API/order logic changed.

## Device proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8393 -OutputDir docs\mobile\screenshots\cycle-JC-trade-ticket-swipe-s23-proof-final -HierarchyOutputDir docs\mobile\harness\cycle-JC-trade-ticket-swipe-s23-proof-final`.
- Result: pass.
- Screenshots:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JC-trade-ticket-swipe-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JC-trade-ticket-swipe-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-totals-ticket-swipe-progress.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JC-trade-ticket-swipe-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`

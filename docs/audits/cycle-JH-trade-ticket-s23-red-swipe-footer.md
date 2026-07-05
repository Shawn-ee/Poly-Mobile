# Cycle JH - Trade Ticket S23 Red Swipe Footer

## Reference behavior

- Polymarket's mobile place-order screen uses a dark full-screen ticket body with close, selected team/icon, event title, selected outcome, large centered amount, payout line, odds/available line, presets, and a sparse numeric keypad.
- The submit area is visually separate: a fixed red/pink footer below the dark body, with rounded dark-panel lower corners above it.
- The footer text stays centered while the upward handle visibly follows swipe progress.
- A normal tap should not submit; the order submits only after a clear upward gesture threshold.

## Holiwyn criteria

| Criterion | Priority | Status |
| --- | --- | --- |
| On Samsung S23, the amount, payout line, odds/available line, presets, and full keypad are visible without being covered by the footer. | P0 | Pass |
| The dark ticket panel and red/pink swipe footer are visibly separated, with rounded dark lower corners. | P0 | Pass |
| The swipe handle translates upward with gesture progress and exposes proof labels for linked motion. | P0 | Pass |
| A tap on the submit surface does not place an order. | P0 | Pass |
| A threshold upward swipe places the fake-token/server-backed order and reaches Portfolio/history. | P0 | Pass |
| Backend/order route contracts remain unchanged. | P0 | Pass |
| Exact native blur/armed transition polish. | P2 | Tracked |

## Implementation notes

- `src/components/TradeTicket.tsx` increases S23-safe dark-panel/footer spacing, uses a taller fixed red/pink footer, preserves rounded lower panel corners, and increases swipe handle travel from a short cue to a visibly moving upward handle.
- `scripts/smoke.ps1` now asserts the S23 footer/layout markers and long-travel swipe markers in the Local MVP proof.
- No backend route, order service, schema, order book, chat, live stats, deposit, withdraw, or location-check work is part of this cycle.

## Device proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8398 -OutputDir docs\mobile\screenshots\cycle-JH-trade-ticket-s23-red-swipe-footer-proof -HierarchyOutputDir docs\mobile\harness\cycle-JH-trade-ticket-s23-red-swipe-footer-proof`.
- Result: pass.
- Ticket-ready screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JH-trade-ticket-s23-red-swipe-footer-proof\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`.
- Swipe-progress screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-JH-trade-ticket-s23-red-swipe-footer-proof\cycle-EY-holiwyn-route-server-mvp-totals-ticket-swipe-progress.png`.
- XML proof: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JH-trade-ticket-s23-red-swipe-footer-proof\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.xml`.
- Flow proof summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-JH-trade-ticket-s23-red-swipe-footer-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

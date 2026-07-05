# Cycle HY - Ticket Swipe Reference Layout

## Scope

Local MVP Trade Ticket amount-entry screen only. This cycle does not touch order book, chat, live stats, social features, deposits, withdrawals, or backend/order execution logic.

## Polymarket Reference Criteria

| Criterion | Priority | Holiwyn result |
| --- | --- | --- |
| Dark full-screen ticket body contains close button, team/logo area, event title, selected outcome, centered amount, `to win`, odds/available balance, presets, and numeric keypad. | P0 | Passed. `TradeTicket` exposes `ticket-retail-reference-layout`; S23 screenshot shows these elements in one dark body. |
| Red/pink swipe-to-buy area is fixed below the dark body, with rounded lower corners on the dark panel where the sections meet. | P0 | Passed. `ticket-body-rounded-above-swipe`, `ticket-swipe-area-fixed-bottom`, and `ticket-keypad-swipe-separated` are present in S23 XML. |
| The full keypad must be visible on Samsung S23 and not covered by the swipe area. | P0 | Passed. Final S23 screenshot shows `1-9`, `.`, `0`, and backspace above the pink swipe band. |
| Swipe handle should translate upward with gesture progress and submit only after a clear upward threshold. | P0 | Passed. `SwipeSubmitControl` derives handle translate from `swipeProgress`, exposes `swipe-submit-handle-progress-motion`, keeps tap disabled, and the S23 proof submits with an upward swipe. |
| Helper text stays below the main swipe text with lower contrast. | P0 | Passed. `Final cost may vary.` remains below `Swipe up to buy` with reduced opacity. |
| Backend/order route should remain unchanged. | P0 | Passed. No backend route or order service changed. |

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Result: pass
- Screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\mobile\docs\mobile\screenshots\cycle-HY-ticket-swipe-reference-layout-s23-proof-final\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`
- Summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\mobile\docs\mobile\harness\cycle-HY-ticket-swipe-reference-layout-s23-proof-final\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Remaining Gaps

- P2: exact native Polymarket drag physics and blur treatment.
- P2: provider/team flag artwork remains fixture-dependent.

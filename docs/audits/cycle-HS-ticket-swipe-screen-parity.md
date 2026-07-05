# Cycle HS - Ticket Swipe Screen Parity

## Scope

Local MVP Trade Ticket amount-entry and swipe-to-buy screen only. No backend, order book, chat, live stats, or social feature work.

## Reference Behavior

- Dark full-screen ticket panel with close button, outcome/team visual, event title, and selected outcome.
- Large centered amount, payout line, odds/available balance line, presets, and numeric keypad.
- Separate colored swipe-submit area fixed below the dark panel.
- Dark body has rounded lower corners where it meets the colored swipe area.
- Swipe handle moves upward as the user drags; submit happens only after a clear upward threshold.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| HS-P0-1 | P0 | S23 shows amount, payout, odds/available, presets, and full keypad above the swipe footer. | Passed |
| HS-P0-2 | P0 | Red/pink swipe area is visually separate from the dark keypad body and fixed at the bottom. | Passed |
| HS-P0-3 | P0 | Dark ticket body has rounded lower corners above the swipe area. | Passed |
| HS-P0-4 | P0 | Swipe handle translates upward from `swipeProgress` and submit remains threshold-gated. | Passed |
| HS-P0-5 | P0 | Server-backed fake-token order, Portfolio, and History still pass after swipe submit. | Passed |
| HS-P0-6 | P0 | No order book/chat/live stats work is introduced. | Passed |

## Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HS-ticket-swipe-screen-parity-s23-proof-clean-pass\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`.
- Summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HS-ticket-swipe-screen-parity-s23-proof-clean-pass\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

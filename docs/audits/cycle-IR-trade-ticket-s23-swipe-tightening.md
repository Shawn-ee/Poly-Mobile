# Cycle IR - Trade Ticket S23 Swipe Tightening

## Scope

Local MVP Trade Ticket amount-entry and swipe-to-buy screen only. No order book, chat, live stats, social features, deposit, withdraw, or backend/order route changes.

## Reference Behavior

The Polymarket reference ticket screenshot shows a dark full-screen amount-entry body with close control, market icon/team flag, compact event title, selected outcome, large amount, `to win`, odds/available balance, preset amounts, numeric keypad, and a large red/pink fixed swipe area below the dark body. The dark panel has rounded lower corners, and the swipe handle moves upward during the gesture.

## Acceptance Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Dark ticket body and red/pink swipe footer are visually separated on Samsung S23. | P0 | Pass |
| Amount, `to win`, odds/balance, presets, full keypad, and backspace are visible above the footer on S23. | P0 | Pass |
| Swipe text remains centered, with lower-contrast helper copy below it. | P0 | Pass |
| Swipe handle visibly translates upward during the gesture. | P0 | Pass |
| Submit only happens after an upward threshold swipe. | P0 | Pass |
| Long provider-style fixture titles are compact in the ticket header. | P0 | Pass |
| Backend/order contracts remain unchanged. | P0 | Pass |
| Exact Polymarket native blur/physics and production artwork. | P2 | Tracked |

## Implementation

- `src/components/TradeTicket.tsx` adds phone-height ticket spacing, S23 footer/keypad proof labels, compact long matchup title formatting, and visible swipe-handle travel.
- `scripts/smoke.ps1` now requires `ticket-s23-safe-vertical-fit`, `ticket-s23-keypad-footer-gap`, `ticket-swipe-footer-fixed-separate`, `ticket-event-title-compact-matchup`, `BHO vs BAW`, and swipe handle travel markers in the route-backed S23 ticket proof.

## Device Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Result: pass.
- Ticket-ready screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IR-trade-ticket-s23-swipe-tightening-proof-final2\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`.
- Mid-swipe screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IR-trade-ticket-s23-swipe-tightening-proof-final2\cycle-EY-holiwyn-route-server-mvp-totals-ticket-swipe-progress.png`.
- Portfolio History screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IR-trade-ticket-s23-swipe-tightening-proof-final2\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`.
- Proof summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IR-trade-ticket-s23-swipe-tightening-proof-final2\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

## Remaining Gaps

- P2: exact Polymarket native physics, blur, and final production event/team artwork.

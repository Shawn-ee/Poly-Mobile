# Cycle HM - Ticket Retail Order Screen Parity

## Scope

Local MVP retail betting flow only: line-market ticket, amount entry, functional settings icon, swipe-submit fake-token/server-backed order, and Portfolio History proof.

## Reference Behavior

Polymarket's mobile order page uses a compact top row with close, selected outcome context, a right-side settings/filter control, large amount display, Yes/No toggle, odds/available balance, quick amount buttons, keypad, and a blue upward swipe confirmation area. The visible order page should stay simple and amount-first.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Ticket opens with a compact order header instead of separated header/summary rows. | Pass |
| P0 | Settings/filter icon is functional and opens a small order context panel. | Pass |
| P0 | Default ticket keeps advanced/provider/orderbook detail out of visible UI while preserving hidden proof identity. | Pass |
| P0 | Keypad, quick amounts, and swipe-submit remain usable on Samsung S23. | Pass |
| P0 | Server-backed fake-token order still reaches Portfolio History with selected line/provider identity preserved. | Pass |

## Proof

- Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Server-filled Totals proof with `scripts\local-mvp-route-server-filled-totals-proof.ps1`, port `8312`.
- Screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HM-ticket-retail-order-screen-parity-s23-proof\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`.
- Summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HM-ticket-retail-order-screen-parity-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

## Remaining Gaps

- P2: exact Polymarket native blur depth and drag physics are not fully matched.

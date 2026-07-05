# Cycle IW - Trade Ticket S23 Swipe Layout

## Scope

Local MVP Trade Ticket amount-entry screen only:

`Event Detail -> line market -> simple Buy ticket -> fake-token/server-backed order -> Portfolio/history`

Out of scope: order book, chat, live stats, social features, deposit/withdraw, backend order logic.

## Reference Criteria

From the attached Polymarket place-order screenshots, the ticket should present:

- Dark full-screen amount/keypad body.
- Header with close control, market/team icon, event title, and selected outcome.
- Large centered amount.
- `to win $X` directly under the amount.
- Odds and available balance line below the side toggle.
- Presets for `+$25`, `+$50`, and `Max`.
- Full numeric keypad inside the dark body.
- Red/pink swipe submit area fixed below the dark body.
- Rounded lower corners on the dark body where it meets the red/pink submit area.
- Swipe handle/arrow that visibly moves upward with the user's gesture.
- Submit only after a clear upward threshold.

## Holiwyn Acceptance Criteria

| Criteria | Priority | Result | Evidence |
| --- | --- | --- | --- |
| S23 shows full amount, `to win`, side toggle, odds/balance, presets, and keypad. | P0 | Pass | `cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png` |
| Keypad bottom row does not overlap the red/pink swipe area. | P0 | Pass | XML bounds show keypad ends at y=1500 and swipe footer starts at y=1752. |
| Dark ticket body has rounded lower corners above the red/pink swipe footer. | P0 | Pass | S23 ticket-ready screenshot. |
| Swipe text remains centered in the red/pink area with lower-contrast helper text below. | P0 | Pass | S23 ticket-ready and swipe-progress screenshots. |
| Swipe arrow visibly moves upward during gesture progress. | P0 | Pass | S23 swipe-progress screenshot shows the handle lifted above the centered label. |
| Swipe-to-buy submits only after upward threshold. | P0 | Pass | S23 proof completes order after scripted upward swipe and retains `swipe-submit-tap-disabled` proof label. |
| Backend/order logic remains unchanged. | P0 | Pass | No backend files changed; proof still passes through existing `POST /api/orders`, Portfolio, and History. |

## Device Proof

- Device: Samsung S23 `SM-S911U1`
- ADB id: `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Command: `powershell -ExecutionPolicy Bypass -File scripts\local-mvp-route-server-filled-totals-proof.ps1 -Device adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp -Port 8382 -OutputDir docs\mobile\screenshots\cycle-IW-trade-ticket-s23-swipe-layout-final -HierarchyOutputDir docs\mobile\harness\cycle-IW-trade-ticket-s23-swipe-layout-final`
- Result: pass

Artifacts:

- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IW-trade-ticket-s23-swipe-layout-final\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IW-trade-ticket-s23-swipe-layout-final\cycle-EY-holiwyn-route-server-mvp-totals-ticket-swipe-progress.png`
- `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IW-trade-ticket-s23-swipe-layout-final\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Remaining Gaps

- P2: exact native Polymarket blur/gesture physics.
- P2: production event/team artwork for all World Cup markets.

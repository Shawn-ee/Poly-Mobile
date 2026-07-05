# Cycle HF - Ticket Swipe Required Retail Flow

## Scope

Local MVP retail betting flow only:

`Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token order -> Portfolio/history`

## Polymarket Reference Behavior

The provided Polymarket screenshots show a full-screen mobile order page with:

- compact event/outcome header
- large amount display
- Yes/No selector
- quick amount buttons and numeric keypad
- simple odds/available balance line
- blue footer with upward confirmation gesture
- order placement gated by swiping up rather than a normal form button

## Holiwyn Acceptance Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Ticket keeps the simplified order page with amount keypad, odds line, selected line/outcome identity, and blue swipe footer. | P0 | Passed |
| A normal tap on the submit area must not place the order. | P0 | Passed |
| An upward swipe on the footer places the fake-token order and lands on Portfolio. | P0 | Passed |
| Portfolio after submit must still show the created position, Buy more, Cash out, Orders, and History. | P0 | Passed |
| Backend/API route must not change for this interaction-only cycle. | P0 | Passed |

## Implementation Notes

- `src/components/TradeTicket.tsx` changes `SwipeSubmitControl` from a tap-capable `Pressable` into a gesture-only accessible `View`.
- The submit surface now exposes `swipe-submit-tap-disabled` in accessibility proof metadata.
- `scripts/smoke.ps1` now taps the submit surface first and proves the ticket remains open, then performs an upward swipe and proves the Portfolio state.
- No order service, API request body, route, schema, or Portfolio state contract changed.

## Proof

- Device: Samsung tablet `SM_X526C`.
- Final command: `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8278 -OutputDir docs/mobile/screenshots/cycle-HF-ticket-swipe-required-retail-flow-final -HierarchyOutputDir docs/mobile/harness/cycle-HF-ticket-swipe-required-retail-flow-final`.
- Result: pass.
- Failed attempts: ports `8276` and `8277` proved tap was ignored but exposed that the previous submit surface/short gesture did not receive the Android swipe reliably. The component was corrected to a gesture surface and the proof swipe was lengthened.
- Final evidence:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HF-ticket-swipe-required-retail-flow-final\cycle-HF-holiwyn-local-mvp-ticket-ready.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HF-ticket-swipe-required-retail-flow-final\cycle-HF-holiwyn-local-mvp-ticket-tap-ignored.xml`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HF-ticket-swipe-required-retail-flow-final\cycle-HF-holiwyn-local-mvp-portfolio.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HF-ticket-swipe-required-retail-flow-final\cycle-HF-local-mvp-trade-flow-proof.json`

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| Exact Polymarket native drag physics, blur depth, and final pixel matching are still not identical. | P2 | Tracked |

# Place Order Sheet Polymarket Reference Audit

## Scope

Feature: mobile place-order ticket sheet.

Cycle: FO - Polymarket-like place order sheet.

## Reference From User Screenshots

The supplied Polymarket screenshots show a minimal dark order sheet:

- Close control on the left and settings/filter control on the right.
- Event and selected outcome are shown as a compact header.
- Amount is the dominant visual element.
- Yes/No selector is compact.
- Odds and available balance are a single quiet line.
- Presets are simple text actions: `+5`, `+10`, `Max`.
- Keypad is sparse and unboxed.
- Submit is a large blue bottom swipe area with an upward cue.
- Data under the event is intentionally simple.

## Holiwyn Acceptance Criteria

### P0

- Remove bulky user-facing order-review card from the default ticket view.
- Keep selected event/outcome visible in a compact header.
- Keep amount, Yes/No selector, odds/balance, +5/+10/Max, keypad, and swipe-up submit visible.
- Preserve line/period/price/shares/payout identity in testable labels for order/Portfolio handoff.
- Android proof must show the simplified ticket on a physical device.

### P1

- Submit-area styling should move closer to Polymarket's blue swipe surface.
- Settings/details may still expose advanced order details, but default view stays simple.

### P2

- Exact gradient, blur, and swipe animation parity.

## Audit Gate Result

Status: pass.

Device proof: `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -EventDetailTrade -Port 8223` passed on Samsung tablet `SM_X526C`.

Implementation change: `src/components/TradeTicket.tsx` now presents a simplified place-order sheet and keeps backend-shaped order identity hidden from the default visual layout while preserving it in hierarchy labels. A follow-up `LocalMvpSellFlow` proof on port `8222` also passed, confirming the simplified ticket still submits the No/Sell path into Portfolio.

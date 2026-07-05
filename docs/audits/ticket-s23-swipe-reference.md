# Cycle IJ - Trade Ticket S23 Swipe Reference

## Scope

Local MVP Trade Ticket amount-entry screen only. No order book, chat, live stats, social, deposit, withdraw, or backend/order route changes.

## Reference Behaviors

- Polymarket-style mobile ticket uses a dark full-screen amount body with close, event/outcome header, large centered amount, `to win`, odds/available balance, presets, and a sparse numeric keypad.
- The submit area is a separate red/pink zone fixed below the dark ticket body.
- The dark ticket body has rounded lower corners where it meets the swipe zone.
- The swipe handle moves upward with gesture progress and only submits after a clear upward gesture threshold.

## Holiwyn Criteria

| Criteria | Priority | Result |
| --- | --- | --- |
| Dark amount/keypad body and fixed pink swipe footer are separated on Samsung S23. | P0 | Pass |
| Amount, `to win`, odds/balance, presets, full keypad, and backspace are visible on S23 without overlap. | P0 | Pass |
| Swipe footer text is centered and helper copy is lower contrast. | P0 | Pass |
| Swipe handle translates upward with gesture progress. | P0 | Pass |
| Tap on submit surface does not submit; upward threshold swipe submits. | P0 | Pass |
| Existing route-backed fake-token order and Portfolio History flow still passes. | P0 | Pass |
| Exact native Polymarket physics and production team flag art. | P2 | Tracked |

## Implementation Notes

- `src/components/TradeTicket.tsx` now uses a fixed upper dark panel and lower pink footer instead of a scrollable ticket body competing with the footer.
- `SwipeSubmitControl` increases handle travel and exposes `swipe-submit-handle-progress-animated` for device proof.
- `src/localization/appCopy.ts` changes visible footer copy from `Swipe up to buy/sell` to `Swipe to buy/sell`.
- `scripts/smoke.ps1` now captures a mid-swipe screenshot while the long upward gesture is active.

## Backend/API

No backend or request/response contract changed.

- Submit route remains `POST /api/orders`.
- Portfolio verification still consumes `GET /api/portfolio` and Portfolio History state.
- Ticket identity still carries market, outcome, line, period, side, contract side, provider source, and provider token fields.

## Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Typecheck: `npm run typecheck` passed.
- Smoke: `scripts\local-mvp-route-server-filled-totals-proof.ps1` passed on port `8353`.
- Ticket-ready screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IJ-trade-ticket-s23-swipe-reference-proof-final\cycle-EY-holiwyn-route-server-mvp-totals-ticket-ready.png`.
- Mid-swipe screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IJ-trade-ticket-s23-swipe-reference-proof-final\cycle-EY-holiwyn-route-server-mvp-totals-ticket-swipe-progress.png`.
- Portfolio History screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IJ-trade-ticket-s23-swipe-reference-proof-final\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`.

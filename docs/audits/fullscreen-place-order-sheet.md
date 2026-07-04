# Full-Screen Place Order Sheet Audit

## Reference

User-provided Polymarket mobile screenshots show the place-order flow as a dedicated full-screen order page:

- dark full-screen ticket surface;
- simple close button, event title, selected Yes/No outcome, and settings/filter control;
- very large amount display;
- compact Yes/No toggle;
- odds and available balance line;
- simple `+5`, `+10`, and `Max` controls;
- sparse numeric keypad;
- large blue bottom area that tells the user to choose an amount or swipe up to buy.

The visible Event Detail page should not remain behind the order UI once the user is placing an order.

## Holiwyn Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Opening a market ticket shows a full-screen opaque order surface rather than an 88% bottom sheet. | P0 | Android screenshot/device smoke. |
| The place-order screen keeps the simplified event/outcome header, large amount, Yes/No toggle, odds/balance, presets, keypad, and blue submit area. | P0 | Android screenshot/XML. |
| Swipe-up submit remains the primary submit interaction and keeps selected market/outcome/line identity. | P0 | Existing ticket and submit smoke flows. |
| Settings/details can still reveal advanced order proof details without cluttering the default view. | P1 | Android smoke. |
| Exact Polymarket gradient/blur and swipe animation polish. | P2 | Deferred visual polish. |

## Cycle FP Result

- Implementation: `TradeTicket` now uses a full-screen opaque modal with a taller blue submit footer.
- Backend/API impact: none.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -EventDetailTrade -Port 8224`.
- Audit status: P0 pass. Remaining P2 polish is exact gradient/blur transition behavior.

## Cycle FZ - Swipe Confirmation Proof

### Reference Refresh

The user-provided Polymarket place-order screenshots show the submit area as a large blue zone with an upward cue and `Swipe to buy`. The interaction should be proven as a swipe, not only as a tap on a submit button.

### Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Submit control exposes a swipe-required state and handle cue. | P0 | Android XML. |
| Local MVP buy-flow proof submits with an actual upward device swipe. | P0 | Samsung tablet smoke. |
| The swipe still preserves selected market, line, period, outcome, side, amount, and Portfolio/history handoff. | P0 | Samsung tablet smoke. |
| The blue footer is visually closer to the reference with layered blue bands and an upward cue. | P1 | Android screenshot. |
| Exact native blur/gesture physics and no tap fallback at all. | P2 | Deferred; tap fallback remains for accessibility/harness compatibility. |

### Result

- Implementation: `SwipeSubmitControl` now exposes swipe gesture state/progress, owns the touch gesture from start, and keeps a visible upward handle inside a layered blue submit footer. The Local MVP proof submits with a footer-local upward swipe.
- Backend/API impact: none. The submit still calls the existing `placeOrder(amount, side, contractSide)` flow.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8239`.
- Audit status: P0 pass. Remaining P2 gap is exact native blur/gesture physics and removal of the accessibility tap fallback.

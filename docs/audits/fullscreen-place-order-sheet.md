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

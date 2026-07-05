# Ticket Retail Amount Sheet Tightening Audit

## Reference

User-provided Polymarket order screenshots show a full-screen retail amount sheet:

- close control, event title, selected Yes/No outcome, and settings control at the top;
- large amount display;
- simple Yes/No selector;
- compact odds and available balance line;
- amount presets and keypad;
- blue swipe-up confirmation area.

The visible sheet should stay simple. Market, line, period, shares, payout, provider token, and order identity still need to be preserved for the order and Portfolio handoff, but they should not appear as a cluttered visible review block in the default Local MVP ticket.

## Cycle GF Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Ticket keeps the amount-first Polymarket-like layout with event/outcome header, amount, Yes/No selector, odds/available line, keypad, and swipe footer. | P0 | Android screenshot/XML. |
| Old `Order review / MARKET / LINE / PERIOD / SHARES / TO WIN` copy does not appear in the default ticket hierarchy. | P0 | Android hierarchy absence check. |
| Market/line/period/shares/payout/provider identity remains machine-readable for order submission and Portfolio proof. | P0 | Android XML and Local MVP submit proof. |
| Ticket outcome separator renders cleanly on Android. | P0 | Android screenshot/XML. |
| Backend/API route changes are not required. | P0 | Code/docs review. |
| Exact native blur and continuous swipe physics remain polish. | P2 | Deferred. |

## Cycle GF Result

- Implementation: `TradeTicket` now keeps the amount-first sheet while removing old review-copy words from the hidden ticket identity node. The selected outcome separator now uses an ASCII hyphen for stable Android rendering.
- Backend/API impact: none. Existing local/server order submission and `TicketSelection` identity fields are unchanged.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8245 -OutputDir docs/mobile/screenshots/cycle-GF-ticket-retail-amount-sheet -HierarchyOutputDir docs/mobile/harness/cycle-GF-ticket-retail-amount-sheet`.
- Audit status: P0 pass for the Local MVP ticket amount sheet. Remaining P2 gaps are exact native blur and continuous swipe physics.

## Cycle GT - Wide Android Ticket Column Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| On a wide Android proof device, the place-order amount sheet keeps a phone-like centered trading column instead of stretching the keypad and amount controls across the full tablet width. | P0 | Samsung tablet screenshot/XML. |
| The full-width blue swipe footer remains the dominant submit surface and still exposes `Swipe up to buy` after amount entry. | P0 | Samsung tablet screenshot/XML and smoke assertion. |
| The compact ticket still preserves selected line/outcome/provider identity through fake-token order submit and Portfolio/history. | P0 | Local MVP trade-flow smoke proof. |
| Backend/API route changes are not required. | P0 | Code/docs review. |
| Exact Polymarket native animation/blur remains polish. | P2 | Deferred. |

## Cycle GT Result

- Status: pass.
- Implementation: `TradeTicket` constrains the scrollable amount-entry content to a centered phone-width column while leaving the full-screen ticket and blue swipe footer intact.
- Backend/API impact: none. Existing ticket/order/Portfolio contracts are unchanged.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8259 -OutputDir docs/mobile/screenshots/cycle-GT-ticket-phone-width-retail-flow -HierarchyOutputDir docs/mobile/harness/cycle-GT-ticket-phone-width-retail-flow`.
- Audit status: P0 pass for the wide Android ticket column. Remaining P2 gaps are exact native blur and continuous swipe physics.

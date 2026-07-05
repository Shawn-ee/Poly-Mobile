# Ticket Default Simple Retail Flow Audit

## Reference Direction

The user-provided Polymarket order-entry screenshots show a default ticket focused on one action: choose an amount, then swipe up to buy or sell. The visible page should not expose trading-mode, depth, slippage, or estimate-grid controls in the Local MVP path.

## Cycle GX Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| The default ticket has no visible settings/advanced button. | P0 | Samsung tablet screenshot/XML absence check. |
| The default ticket does not show trading mode, market depth, best bid/ask, slippage, or estimate-grid controls. | P0 | Samsung tablet XML absence check. |
| The ticket still shows selected event/outcome/line, `$0`, Yes/No toggle, odds/balance, presets, keypad, and `Choose an amount`. | P0 | Samsung tablet screenshot/XML. |
| After amount entry, the ticket shows amount, payout, current price, and `Swipe up to buy`. | P0 | Samsung tablet screenshot/XML. |
| The same simplified ticket behavior holds for Portfolio Buy more and Cash out tickets. | P0 | Samsung tablet screenshot/XML. |
| Hidden proof identity still preserves market, line, period, provider token, side, and payout data for order/Portfolio verification. | P0 | Samsung tablet XML. |
| Backend/API route changes are not required. | P0 | Code/docs review. |

## Cycle GX Result

- Status: pass.
- Implementation: `TradeTicket` removes the visible settings/advanced doorway from the default Local MVP ticket and keeps internal price context in a non-visible proof node without reusing advanced-control labels.
- Backend/API impact: none. Existing ticket submit, fake-token order, Portfolio, Orders, and History contracts are unchanged.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8264 -OutputDir docs/mobile/screenshots/cycle-GX-ticket-default-simple-retail-flow -HierarchyOutputDir docs/mobile/harness/cycle-GX-ticket-default-simple-retail-flow`.
- Audit status: P0 pass. Remaining P2 polish is exact native blur/drag physics and final phone pixel matching.

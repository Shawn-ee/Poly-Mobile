# Cycle GV - Event Detail Phone-Width Retail Flow

## Reference And Scope

Current Local MVP priority remains:

Home -> Event Detail -> line market -> simple Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history.

The Samsung tablet is the Holiwyn proof device, but the product target is a mobile phone-style retail betting flow. After ticket and Portfolio were constrained to phone-width columns on the tablet, Event Detail still stretched chart controls, tabs, line cards, and market rows across the full tablet width. That made the main game page feel less like the Polymarket mobile reference.

This cycle is layout-only. It does not add order book UI, chat, live stats, social features, watchlists, or backend provider work.

## Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| On the Samsung tablet proof device, Event Detail chart, selected trade rail, line cards, and market rows render inside a centered phone-width column. | P0 | Samsung tablet screenshot/XML. |
| Existing Game header, chart/probability display, line selector, Trade ticket handoff, and selected line identity remain available. | P0 | Local MVP trade-flow smoke proof. |
| Ticket, fake-token order submit, Portfolio, Orders, and History still work after the Event Detail layout constraint. | P0 | Local MVP trade-flow smoke proof. |
| Backend/API route changes are not required. | P0 | Code/docs review. |
| Exact native chart physics, final Polymarket pixel matching, and tablet-specific responsive layout polish remain P2. | P2 | Deferred. |

## Result

- Status: pass.
- Implementation: `EventDetail` constrains its scroll content to a centered phone-width column on wide Android screens.
- Backend/API impact: none. Existing chart, market, ticket, order, and Portfolio contracts are unchanged.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8261 -OutputDir docs/mobile/screenshots/cycle-GV-event-detail-phone-width-retail-flow -HierarchyOutputDir docs/mobile/harness/cycle-GV-event-detail-phone-width-retail-flow`.
- Audit status: P0 pass for the wide Android Event Detail column. Remaining P2 gaps are exact native chart physics, final Polymarket pixel matching, and tablet-specific responsive polish.

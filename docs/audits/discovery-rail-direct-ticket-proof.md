# Discovery Rail Direct Ticket Proof Audit

## Reference

The Local MVP discovery card should behave like a retail betting entry point: the user can tap a visible outcome button and go directly to the simple amount ticket. The full event card should still open Event Detail, but the outcome rail must not be merely decorative.

## Cycle GH Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Discovery card outcome rail remains the visible game-card prediction control. | P0 | Android screenshot/XML. |
| Old row-style outcome layout is hidden from the rendered MVP card. | P0 | Android screenshot/XML after `display: none`. |
| Tapping a retail outcome rail button opens the simple Buy/Sell ticket. | P0 | Android smoke. |
| Closing that ticket returns to discovery and the full card still opens Event Detail. | P0 | Android smoke. |
| Backend/API contracts are unchanged. | P0 | Code/docs review. |
| Exact card animation/typography remains polish. | P2 | Deferred. |

## Cycle GH Result

- Implementation: old row-style outcome fallback is now `display: none`, and the route-backed smoke taps the retail outcome rail directly before continuing through the full card-to-detail flow.
- Backend/API impact: none. Discovery, ticket, order, and Portfolio contracts are unchanged.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port 8247 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-GH-discovery-rail-direct-ticket -HierarchyOutputDir docs/mobile/harness/cycle-GH-discovery-rail-direct-ticket`.
- Audit status: P0 pass for direct discovery rail-to-ticket behavior.

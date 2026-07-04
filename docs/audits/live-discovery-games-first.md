# Live Discovery Games-First Audit

## Reference

The current Local MVP live page should put live soccer games first. Market and outcome counts are useful as proof metadata, but they should not appear as prominent operational summary pills above the betting cards.

## Cycle GI Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Live page keeps the World Cup live games header and route-backed game cards. | P0 | Android screenshot/XML. |
| Visible market/outcome summary pills are removed from the default Local MVP Live page. | P0 | Android hierarchy absence check. |
| Market/outcome counts remain available as hidden proof metadata. | P0 | Android XML. |
| Direct discovery outcome rail and card-to-detail ticket path still pass. | P0 | Android smoke. |
| Backend/API contracts are unchanged. | P0 | Code/docs review. |
| Exact Polymarket Live page animation/polish remains future work. | P2 | Deferred. |

## Cycle GI Result

- Implementation: `LiveScreen` now hides market/outcome summary pills from the default MVP surface and keeps count data in `live-counts-hidden-local-mvp`.
- Backend/API impact: none. Live event discovery and refresh contracts are unchanged.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port 8248 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-GI-live-discovery-games-first -HierarchyOutputDir docs/mobile/harness/cycle-GI-live-discovery-games-first`.
- Audit status: P0 pass for games-first Live discovery.

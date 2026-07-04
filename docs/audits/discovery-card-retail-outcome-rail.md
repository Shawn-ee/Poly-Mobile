# Discovery Card Retail Outcome Rail Audit

## Reference

The Local MVP starts at Home or Live discovery and should quickly lead a user into a soccer prediction. For the current retail betting path, the game card should emphasize the two tappable outcomes and their probabilities, not operational volume/liquidity stats.

## Cycle GG Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Route-backed World Cup game cards show a two-button retail outcome rail. | P0 | Android screenshot/XML. |
| Tapping the card still opens Event Detail. | P0 | Android smoke. |
| Tapping an outcome rail item still opens the same simple ticket path. | P0 | Existing ticket callbacks and Android hierarchy labels. |
| Visible game-card volume/liquidity stats are removed from the default MVP discovery surface. | P0 | Android hierarchy absence check. |
| Backend/API contracts are unchanged. | P0 | Code/docs review. |
| Exact Polymarket card typography and animations remain polish. | P2 | Deferred. |

## Cycle GG Result

- Implementation: `MarketList` now presents route-backed game cards with a two-button retail outcome rail. Volume/liquidity are retained only as hidden proof metadata for the Local MVP game-card path.
- Backend/API impact: none. Discovery still uses the same event, market, and outcome payloads.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpHomeRouteTicketFlow -Port 8246 -BackendBaseUrl http://172.16.200.14:3002 -OutputDir docs/mobile/screenshots/cycle-GG-discovery-card-retail-outcome-rail -HierarchyOutputDir docs/mobile/harness/cycle-GG-discovery-card-retail-outcome-rail`.
- Audit status: P0 pass for route-backed discovery card retail outcome rail. Remaining P2 gap is exact Polymarket card typography/animation.

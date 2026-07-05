# Event Detail Hide Volume Retail Flow Audit

## Reference Direction

The Local MVP game page should keep the user focused on event state, probability, line selection, and ticket entry. Volume and liquidity are useful provider/internal data, but they should not compete with the default retail betting path on the visible Event Detail surface.

## Cycle GZ Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Event Detail top market area no longer shows visible volume text such as `98,750 USDT Vol.`. | P0 | Samsung tablet screenshot/XML absence check. |
| Team to Advance card no longer shows visible `$60.9K Vol.` subcopy. | P0 | Samsung tablet screenshot/XML absence check. |
| Team to Advance card keeps simple prediction context with a visible `Winner market` label. | P0 | Samsung tablet screenshot/XML. |
| Event Detail still exposes Game Lines, spread/totals selectors, selected line, ticket, fake-token submit, Portfolio, Orders, and History. | P0 | Local MVP trade-flow smoke proof. |
| Backend/API route changes are not required. | P0 | Code/docs review. |

## Cycle GZ Result

- Status: pass after proof rerun.
- Implementation: `EventDetail` hides visible volume copy from the default body switch and replaces the Team to Advance volume subcopy with `Winner market`.
- Backend/API impact: none. Existing event stats remain in summary/proof metadata and no route, schema, request, or response changed.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8267 -OutputDir docs/mobile/screenshots/cycle-GZ-event-detail-hide-volume-retail-flow-rerun -HierarchyOutputDir docs/mobile/harness/cycle-GZ-event-detail-hide-volume-retail-flow-rerun`.
- Failed proof note: the first run on port 8266 confirmed the visible UI change but failed because the hidden-volume assertion was placed at the wrong scroll position. The proof gate was corrected to assert visible criteria: `Winner market` present and old visible volume strings absent.
- Audit status: P0 pass.

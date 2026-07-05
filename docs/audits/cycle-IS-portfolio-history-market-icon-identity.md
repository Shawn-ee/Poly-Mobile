# Cycle IS - Portfolio History Market Icon Identity

## Scope

Local MVP Portfolio History row after a server-backed fake-token buy. This cycle does not touch order book, chat, live stats, social features, deposit, withdraw, or backend/order execution.

## Reference Behavior

The Polymarket Portfolio History reference uses compact activity rows with a meaningful leading visual, outcome/action text, event, amount, and time. Holiwyn's route-backed totals history row previously fell back to a generic down-arrow icon, even though the selected market was a totals line and the ticket/position surfaces already used market identity.

## Acceptance Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| A filled totals trade History row uses a market identity icon instead of a generic action arrow. | P0 | Pass |
| The icon is objectively auditable in XML as `portfolio-history-market-icon-totals`. | P0 | Pass |
| The row still shows action, Yes/No side, outcome, event, market line, amount, and timestamp. | P0 | Pass |
| Selected line/provider identity survives ticket, order, Portfolio, and History. | P0 | Pass |
| Backend/order contracts remain unchanged. | P0 | Pass |
| Production artwork and exact Polymarket icon set. | P2 | Tracked |

## Implementation

- `src/components/Portfolio.tsx` derives History leading icons from team identity or `selection.marketType`.
- `scripts/smoke.ps1` now requires `portfolio-history-market-icon` and `portfolio-history-market-icon-totals` in the S23 route-backed filled totals proof.

## Device Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Result: pass.
- History screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IS-portfolio-history-market-icon-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`.
- History XML: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IS-portfolio-history-market-icon-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.xml`.
- Proof summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IS-portfolio-history-market-icon-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

## Remaining Gaps

- P2: exact production artwork for all market/team types.

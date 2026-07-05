# Cycle IV - Portfolio Compact Event Identity

## Scope

Local MVP Portfolio Positions and History event identity after a route-backed fake-token order. This cycle does not touch order book UI, chat, live stats, social features, deposits, withdrawals, location checks, backend order logic, or provider routes.

## Reference Behavior

Polymarket Portfolio rows use compact match identity rather than long provider/internal event names. After a trade, the result row should be easy to scan and should still preserve the traded market/outcome/line identity.

## Holiwyn Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Route-backed provider-breadth position rows should show compact event identity: `BHO 0 - BAW 0`. | P0 | Passed |
| Route-backed provider-breadth History rows should show compact event identity: `BHO vs BAW`. | P0 | Passed |
| Full selected market identity must remain available for proof/order handoff. | P0 | Passed |
| The Local MVP retail path must still complete: Event Detail -> line market -> ticket -> fake-token order -> Portfolio/history. | P0 | Passed |
| Backend/API contracts must remain unchanged for this visible label correction. | P0 | Passed |

## Implementation Notes

- `src/components/Portfolio.tsx` adds provider-breadth title compaction helpers for Positions and History.
- `scripts/smoke.ps1` now requires `portfolio-event-title-compact-provider`, `BHO 0 - BAW 0`, `portfolio-history-event-title-compact-provider`, and `BHO vs BAW` in the S23 server-filled proof.
- No backend routes, request bodies, response fields, schemas, or order logic changed.

## Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Result: pass.
- Screenshots:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IV-portfolio-compact-event-identity-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio.png`
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IV-portfolio-compact-event-identity-s23-proof\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`
- Proof summary:
  - `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IV-portfolio-compact-event-identity-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Remaining Gaps

- P2: production event/team artwork and exact live score formatting remain future work.

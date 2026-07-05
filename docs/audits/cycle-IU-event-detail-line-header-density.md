# Cycle IU - Event Detail Line Header Density

## Scope

Local MVP Event Detail Game Lines header density only. This cycle does not touch order book UI, chat, live stats, social features, deposits, withdrawals, location checks, backend order logic, or provider routes.

## Reference Behavior

Polymarket mobile market headers use compact human-readable market names with detail in smaller supporting copy. Holiwyn's team-total group showed the long internal-style title `Full Game Team Total Goals (Reg. Time)`, which wrapped heavily on Samsung S23.

## Holiwyn Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| Team-total visible title should be compact enough for S23: `Team Total Goals`. | P0 | Passed |
| Supporting copy should carry the team, line, and period: `BHO goals over 1.5 - Reg. Time`. | P0 | Passed |
| The full market identity must remain available for ordering/proof and ticket handoff. | P0 | Passed |
| The normal Local MVP retail path must still complete: Event Detail -> line market -> ticket -> fake-token order -> Portfolio/history. | P0 | Passed |
| Backend/API contracts must remain unchanged for this visual naming correction. | P0 | Passed |

## Implementation Notes

- `src/components/EventDetail.tsx` adds optional `displayTitle` to `GameLineGroup`.
- The team-total group renders compact visible copy while preserving the full title in `accessibilityLabel`.
- `scripts/smoke.ps1` requires the compact marker in the team-total proof path only.
- No backend routes, request bodies, response fields, schemas, or order logic changed.

## Proof

- Device: Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Header proof: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-IU-event-detail-line-header-density-s23-proof-final\cycle-EZ-holiwyn-route-server-mvp-line-markets.png`
- Header XML: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IU-event-detail-line-header-density-s23-proof-final\cycle-EZ-holiwyn-route-server-mvp-line-markets.xml`
- Full-flow proof: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-IU-event-detail-line-header-density-full-flow-s23-proof\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`

## Remaining Gaps

- P2: exact market naming for every Polymarket soccer line remains future work.

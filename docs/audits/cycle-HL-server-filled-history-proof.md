# Cycle HL - Server Filled History Proof

## Scope

Local MVP retail betting flow only: server-backed filled order through Portfolio position and History activity.

## Reference Behavior

After a filled order, the user should be able to see both the resulting position and the corresponding activity/history row. The History row must preserve the same market, line, outcome, and provider identity as the ticket and position.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Server-backed filled order shows a filled Portfolio position. | Pass |
| P0 | The proof taps Portfolio History after the filled order. | Pass |
| P0 | History exposes `portfolio-tab-history portfolio-tab-selected` and `activity-row-*`. | Pass |
| P0 | History preserves `marketType`, `line`, `period`, provider source, and provider token identity. | Pass |
| P0 | Order book UI remains hidden from the default Local MVP path. | Pass |

## Proof

- Samsung S23 `SM-S911U1`, adb id `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Server-filled Totals proof with `scripts\local-mvp-route-server-filled-totals-proof.ps1`, port `8306`.
- Screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HL-server-filled-history-proof-s23-totals-final\cycle-EY-holiwyn-route-server-mvp-portfolio-history.png`.
- Summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HL-server-filled-history-proof-s23-totals-final\cycle-EY-local-mvp-route-server-filled-totals-flow-proof.json`.

## Remaining Gaps

- P2: exact final History row visual density can still improve later, but the P0 filled order-to-History proof is now real Android evidence.

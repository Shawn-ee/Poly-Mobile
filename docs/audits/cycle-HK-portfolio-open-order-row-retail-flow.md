# Cycle HK - Portfolio Open Order Row Retail Flow

## Scope

Local MVP retail betting flow only: Portfolio Orders row shown after a server-backed fake-token order remains open.

## Reference Behavior

The order result page should make the user's just-created order easy to understand. The visible row should not look like an internal proof/debug panel. Technical identity, order-time snapshot, and provider fields can remain available to the harness as hidden proof metadata.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Server-backed open order lands on Portfolio Orders with a simplified retail row. | Pass |
| P0 | The row exposes `open-order-row-retail-simple` in Android proof. | Pass |
| P0 | Provider market/line/outcome/token identity remains preserved in hidden proof labels. | Pass |
| P0 | Cancel action remains available from the row. | Pass |
| P0 | Order book UI remains hidden from the default Local MVP path. | Pass |

## Proof

- Samsung tablet server-backed proof with `scripts\local-mvp-route-server-order-proof.ps1 -Tablet`, port `8298`.
- Screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HK-portfolio-open-order-row-retail-flow-server-order\cycle-EV-holiwyn-route-server-mvp-portfolio.png`.
- Summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HK-portfolio-open-order-row-retail-flow-server-order\cycle-EV-local-mvp-route-server-order-flow-proof.json`.

## Remaining Gaps

- P2: exact final Portfolio row visual density can still improve later, but the default server open-order row no longer exposes debug/proof clutter as visible user content.

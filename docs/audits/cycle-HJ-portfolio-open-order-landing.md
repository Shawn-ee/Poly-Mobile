# Cycle HJ - Portfolio Open Order Landing

## Scope

Local MVP retail betting flow only: server-backed simple ticket submit into Portfolio open-order visibility.

## Reference Behavior

In the Polymarket-style retail flow, after submitting an order the user should immediately see the result of that action. If the order is not filled yet, the Portfolio/Orders surface should expose the open order rather than leaving the user on an empty positions state.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | A server-backed open order must land on Portfolio with Orders selected. | Pass |
| P0 | The Android proof must show a real `open-order-row-*`, not only hidden count metadata. | Pass |
| P0 | Filled server orders and local filled fake-token orders must continue to show Positions. | Pass |
| P0 | Provider market/line/outcome identity must remain preserved in the open-order row. | Pass |
| P0 | Order book UI must remain hidden from the default Local MVP path. | Pass |

## Proof

- Samsung tablet server-backed proof with `scripts\local-mvp-route-server-order-proof.ps1 -Tablet`, port `8297`.
- Screenshot: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HJ-portfolio-open-order-landing-server-order\cycle-EV-holiwyn-route-server-mvp-portfolio.png`.
- Summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HJ-portfolio-open-order-landing-server-order\cycle-EV-local-mvp-route-server-order-flow-proof.json`.

## Remaining Gaps

- P2: exact Portfolio row visual density still needs future retail polish, but the P0 landing behavior now matches the expected result visibility.

# Cycle HI - Event Detail Hide Single Market Switch

## Scope

Local MVP retail betting flow only: Event Detail default market body, line-market ticket handoff, swipe-submit, and Portfolio open-order proof.

## Reference Behavior

Polymarket's mobile game page does not need a redundant one-option body switch when the page is already in the Game/market context. The primary user action is to inspect game lines, choose a market/outcome, enter an amount, and confirm with an upward swipe on the ticket.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Default Event Detail must show Game Lines without the old visible `event-detail-body-switch` and `event-detail-body-tab-market`. | Pass |
| P0 | Line markets and simple ticket must remain reachable after removing the switch. | Pass |
| P0 | Submit must use the swipe-confirm interaction, not a tap-only order button. | Pass |
| P0 | A server-backed proof must post a fake-token order through `POST /api/orders` and show Portfolio open-order identity. | Pass |
| P0 | Order book UI must remain hidden from the default Local MVP path. | Pass |

## Proof

- Local UI proof: Samsung tablet, `scripts\smoke-tablet.ps1 -LocalMvpTradeFlow`, port `8287`.
- Server-backed proof: Samsung tablet, `scripts\local-mvp-route-server-order-proof.ps1 -Tablet`, port `8296`.
- Final server proof summary: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HI-event-detail-hide-single-market-switch-server-order-clean\cycle-EV-local-mvp-route-server-order-flow-proof.json`.

## Remaining Gaps

- P2: exact Polymarket native spacing, animation, and swipe physics remain future polish.
- P2: server proof adapts to the stable visible line market on tablet; a future harness can use direct coordinate-safe row targeting for every line family.

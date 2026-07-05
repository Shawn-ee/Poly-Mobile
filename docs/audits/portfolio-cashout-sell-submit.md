# Portfolio Cash-Out Sell Submit Audit

## Cycle GL

Scope: Local MVP Portfolio Cash out flow.

Reference direction:
- Cashing out should keep the user in the same simple retail trading model: position -> Sell/No ticket -> fake-token submit -> Portfolio/history.
- A submitted cash-out sell should not create a second visible sell position in the local MVP. It should remove the original position and record Sold activity.

Acceptance criteria:

| Criteria | Priority | Result |
| --- | --- | --- |
| Portfolio Cash out opens a Sell/No ticket with the original line, period, display label, and contract side. | P0 | Passed |
| Swiping the Cash out ticket submits the fake-token Sell order. | P0 | Passed |
| After submit, the original local position is removed from Positions. | P0 | Passed |
| Latest order and History show Sold/Sell identity with the same line-market selection. | P0 | Passed |
| No backend route or schema change is required. | P0 | Passed by implementation review |

Implementation notes:
- `Ticket` can carry `sourcePositionId` when opened from Portfolio.
- Mock `placeOrder` treats `sourcePositionId + sell` as a cash-out submit: balance increases, the source position is removed, latest order is Sell/No, and activity records Sold.
- Server-mode cash-out routes are unchanged; real server close/position lifecycle remains a separate backend-backed milestone.

Audit Gate:
- Device: Samsung tablet.
- Status: Passed.
- Proof: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GL-portfolio-cashout-sell-submit\cycle-GL-local-mvp-trade-flow-proof.json`.

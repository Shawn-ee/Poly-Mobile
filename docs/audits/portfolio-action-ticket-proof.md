# Portfolio Action Ticket Proof Audit

## Cycle GK

Scope: Local MVP Portfolio position actions.

Reference direction:
- The current MVP should keep the user in a simple retail trading loop.
- After a position exists, adding to the position and cashing out should route through the same simple ticket model instead of acting like hidden/debug controls.

Acceptance criteria:

| Criteria | Priority | Result |
| --- | --- | --- |
| Portfolio plus/buy-more action opens a Buy ticket for the existing position. | P0 | Passed |
| Portfolio Cash out opens a Sell/No ticket for the existing position instead of immediately closing locally. | P0 | Passed |
| Ticket handoff preserves market type, line, period, display label, and contract side. | P0 | Passed |
| Existing Portfolio Orders and History tabs still work after closing the action tickets. | P0 | Passed |
| No backend/API route change is required. | P0 | Passed by implementation review |

Implementation notes:
- The visible Portfolio Cash out button now calls `openPositionTrade(position, "sell")`.
- The older direct `closePosition` control remains hidden for existing backend/server close proof paths.
- `openTicket` now resolves `contractSide` from an explicit sell side when the selection does not already provide one.
- `openPositionTrade` passes the stored position selection into the ticket so line, period, display label, and contract side survive Portfolio re-trading.

Audit Gate:
- Device: Samsung tablet.
- Status: Passed.
- Proof: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-GK-portfolio-action-ticket-proof\cycle-GK-local-mvp-trade-flow-proof.json`.

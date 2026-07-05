# Cycle HX - Ticket Header Retail Readability

## Polymarket Reference Behavior

- The ticket header shows a readable event matchup plus the selected contract/outcome.
- The header should not foreground provider slugs or truncate the selected line so aggressively that the user cannot confirm what they are buying.

## Holiwyn Acceptance Criteria

| Priority | Criterion | Verification |
| --- | --- | --- |
| P0 | Ticket header exposes `ticket-header-retail-readable`. | S23 XML proof. |
| P0 | Header event title uses matchup-style copy when event teams are available. | S23 screenshot/XML proof. |
| P0 | Selected line can wrap to two lines on S23 and keeps market/line/provider identity. | S23 ticket screenshot/XML proof. |
| P0 | Backend order/portfolio routes are unchanged. | Git diff and typecheck. |

## Implementation Notes

- `TradeTicket` derives the visible event label from `event.teams` before falling back to the event/market label.
- `ticket-selection-line` now allows two visible lines.
- `scripts/smoke.ps1` requires `ticket-header-retail-readable` in the Local MVP route-backed ticket proof.

## Audit Gate

- Status: pass.
- Required device: Samsung S23 `SM-S911U1`.
- Proof folder: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\screenshots\cycle-HX-ticket-header-retail-readability-s23-proof`.
- Harness folder: `C:\Users\hecto\Desktop\projects\PolyProj\Poly\docs\mobile\harness\cycle-HX-ticket-header-retail-readability-s23-proof`.
- Result: ticket header now uses matchup-style copy, selected line is readable, and the route-backed ticket/order/Portfolio path still passes.

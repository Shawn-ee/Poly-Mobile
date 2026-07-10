# Cycle TK - Portfolio Line Outcome Labels

Status: P0 pass.

## Scope

Cycle TJ proved the Local MVP path still reaches Portfolio History, but the filled History row still read like a generic spread trade. Polymarket-style Portfolio rows make the selected side/line readable, for example `Egypt +1.5`, not only `Spread 1.5`.

This cycle keeps the existing fake-token/server order flow unchanged and improves only the Portfolio-visible label helpers used by Positions, Orders, and History.

## Acceptance Criteria

| Priority | Criterion | Proof |
| --- | --- | --- |
| P0 | A filled spread order with `referenceOutcomeLabel=Egypt +1.5` renders that concrete outcome label in Portfolio History. | Source contract test and S23 History XML. |
| P0 | The S23 proof gate fails if History only exposes generic spread identity without the provider outcome label. | `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1`. |
| P0 | Existing server fake-token order, Portfolio sync, and History proof still pass. | S23 full Local MVP proof. |
| P1 | Positions and open orders use the same selected spread label helper for consistency. | Source contract test. |

## Implementation Notes

- Updated `displayPositionChoice()` in `mobile/src/components/Portfolio.tsx` to treat spread selections like totals/team totals: prefer `selection.referenceOutcomeLabel` when it is concrete, then append the selected line only if needed.
- Tightened the History title row spacing and Android font fitting so the S23 screenshot shows the concrete label instead of clipping it.
- Kept backend route contracts unchanged. The UI consumes the existing `TicketSelection.referenceOutcomeLabel`, `marketType`, `line`, `period`, and provider identity fields already returned/preserved by the current order and Portfolio flow.
- Tightened the S23 proof script so filled/cashout spread History must include `portfolio-history-visible-label-Egypt +1.5` and `portfolio-provider-outcome-Egypt +1.5`.

## Remaining Gaps

- This cycle improves label preservation only. Real Polymarket-backed spread/totals/team-total market availability remains a P1 provider gap for current World Cup matches.
- Wider Portfolio parity for row spacing, filters, and account controls remains separate from this focused label cycle.

## Proof

- Focused Portfolio tests: passed.
- Mobile typecheck: passed.
- Root typecheck: passed.
- Samsung S23 `SM-S911U1`: passed.
- Proof summary: `docs/mobile/harness/cycle-TK-portfolio-line-labels/cycle-TK-current-mvp-s23-visible-flow.json`.
- Portfolio History screenshot: `docs/mobile/screenshots/cycle-TK-portfolio-line-labels/cycle-TK-current-mvp-portfolio-history.png`.

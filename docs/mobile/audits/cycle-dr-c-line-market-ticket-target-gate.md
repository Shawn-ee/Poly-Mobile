# Cycle DR-C Line-Market Ticket Target Audit Gate

Status: pending/fail-until-proof. This gate prepares the checklist for Agent B's line-market ticket target parity against the fresh DQ-C Polymarket reference. It does not pass the feature.

Audit Gate Agent: Agent C2.

Reference source:

- `docs/mobile/audits/live-football-world-cup-dq-c.md`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-08-spread-line-dropdown.png`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-09-spread-line-25.png`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-10-spread-ticket.png`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-11-ticket-sheet-settled.png`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-16-markets-scroll-2.png`
- Matching XML files in `docs/mobile/harness/cycle-DQ-C-polymarket-reference/`

Read-only Agent B context inspected:

- Branch/worktree: `mobile/super-DQ-agent-B-visible-parity` at commit `bd62c9b` (`Fix mobile line ticket target parity`).
- DQ-B proof file observed in that worktree: `docs/mobile/harness/cycle-DQ-B-visible-parity-proof.json`.
- DQ-B Android proof result: failed after capturing spread/totals ticket screenshots/XML because the smoke did not find expected `Odds 22%` text in the visible hierarchy.
- This DQ-B proof is useful background, but it is not clean DR Android proof and cannot pass this gate.

## Pass/Fail Criteria

| ID | Priority | Criterion | Required Agent B proof | Gate status |
| --- | --- | --- | --- | --- |
| LD-DR-C-P0-01 | P0 | Selected market family must match the tapped family: Spread taps open a Spread ticket, Totals taps open a Totals ticket, and lower-period rows do not fall back to a primary moneyline/fallback target. | Android screenshot/XML for at least one Spread and one Totals ticket opened from the DQ-C-style game detail after selection changes. | Pending/fail until proof |
| LD-DR-C-P0-02 | P0 | Selected line must match the user-selected row/selector value. Example reference: Spread changes from `1.5` to `2.5`; Holiwyn proof must show the changed line in the row and in the ticket target. | Before/after selector proof plus ticket XML showing the same selected line in `ticket-selection-line` and selected outcome label. | Pending/fail until proof |
| LD-DR-C-P0-03 | P0 | Selected period must carry through: `Reg. Time`, `1st Half`, and `2nd Half` selections must not collapse into the default period when opening the ticket. | Android proof for at least one non-default period, with row state and ticket target both showing the period. | Pending/fail until proof |
| LD-DR-C-P0-04 | P0 | Selected side/outcome must carry through: Yes/No or Over/Under/team subject must match the tapped row, including subject flips caused by line changes. | Ticket XML must show the side and outcome in `ticket-contract-outcome-row` and `ticket-selected-outcome-choice`; screenshot must visibly agree. | Pending/fail until proof |
| LD-DR-C-P0-05 | P0 | Odds/probability must come from the selected market/line/period/outcome, not stale row state. If the reference-style selected line changes prices, the ticket must reflect the selected row's odds/probability. | Android screenshot/XML and/or proof JSON showing row odds/probability before tap and ticket odds/probability after tap for Spread and Totals. | Pending/fail until proof |
| LD-DR-C-P0-06 | P0 | Ticket target identity must preserve selected market family, line, period, side/outcome, event, provider/source identity where available, and order target through amount entry/ready state. | Clean Android ticket proof after entering an amount, plus XML/proof JSON showing the selection fields used by the order payload or service layer. | Pending/fail until proof |
| LD-DR-C-P0-07 | P0 | Android visible proof must be clean: screenshots and XML must be committed, device/harness result must be pass, and artifacts must be under a DR-C-owned cycle path. | `docs/mobile/screenshots/cycle-DR-C-*`, `docs/mobile/harness/cycle-DR-C-*`, and a proof summary with passing smoke/test results. | Pending/fail until proof |

## Decision

- Pass/fail: Fail until Agent B provides clean DR-C Android proof.
- Unresolved P0 gaps: all LD-DR-C-P0 criteria above remain unresolved.
- Remaining P1/P2 gaps: DQ-C ticket amount/swipe confirmation recapture remains P1 because the official Polymarket S23 reference was location-gated at `Location verification failed`.
- Next required evidence: Agent B must provide DR-C-owned Android screenshots/XML/proof summary for Spread and Totals ticket targets, including selected market family, selected line, selected period, selected side/outcome, row odds/probability, ticket odds/probability, and ticket/order target identity after amount entry or ready state.


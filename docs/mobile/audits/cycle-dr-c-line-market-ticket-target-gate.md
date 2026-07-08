# Cycle DR-C Line-Market Ticket Target Audit Gate

Status: pass for focused ticket-target parity after integrated Android proof. This gate does not pass the full live game page, Book selector, order, portfolio, or history coupling.

Audit Gate Agent: Agent C2.

Reference source:

- `docs/mobile/audits/live-football-world-cup-dq-c.md`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-08-spread-line-dropdown.png`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-09-spread-line-25.png`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-10-spread-ticket.png`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-11-ticket-sheet-settled.png`
- `docs/mobile/screenshots/cycle-DQ-C-polymarket-reference/pm-dq-c-16-markets-scroll-2.png`
- Matching XML files in `docs/mobile/harness/cycle-DQ-C-polymarket-reference/`

Initial read-only Agent B context inspected:

- Branch/worktree: `mobile/super-DQ-agent-B-visible-parity` at commit `bd62c9b` (`Fix mobile line ticket target parity`).
- DQ-B proof file observed in that worktree: `docs/mobile/harness/cycle-DQ-B-visible-parity-proof.json`.
- DQ-B Android proof result at the first inspected commit: failed after capturing spread/totals ticket screenshots/XML because the smoke did not find expected `Odds 22%` text in the visible hierarchy.
- Agent B follow-up exposed the ticket odds/keypad by default. Lead then reran the integrated branch smoke and captured passing DR-C integrated proof.

Integrated Holiwyn proof:

- Command: `powershell -ExecutionPolicy Bypass -File mobile/scripts/smoke-tablet.ps1 -EventDetailLineAdjustment -Port 8226`
- Device: Samsung tablet / Holiwyn Expo Go
- Result: pass
- Proof summary: `docs/mobile/harness/cycle-DR-C-integrated-line-market-ticket-proof.json`
- Spread ticket: `docs/mobile/screenshots/cycle-DR-C-integrated-line-adjustment-spread-ticket.png`; `docs/mobile/harness/cycle-DR-C-integrated-line-adjustment-spread-ticket.xml`
- Totals ticket: `docs/mobile/screenshots/cycle-DR-C-integrated-line-adjustment-totals-ticket.png`; `docs/mobile/harness/cycle-DR-C-integrated-line-adjustment-totals-ticket.xml`

## Pass/Fail Criteria

| ID | Priority | Criterion | Required Agent B proof | Gate status |
| --- | --- | --- | --- | --- |
| LD-DR-C-P0-01 | P0 | Selected market family must match the tapped family: Spread taps open a Spread ticket, Totals taps open a Totals ticket, and lower-period rows do not fall back to a primary moneyline/fallback target. | Android screenshot/XML for at least one Spread and one Totals ticket opened from the DQ-C-style game detail after selection changes. | Pass |
| LD-DR-C-P0-02 | P0 | Selected line must match the user-selected row/selector value. Example reference: Spread changes from `1.5` to `2.5`; Holiwyn proof must show the changed line in the row and in the ticket target. | Before/after selector proof plus ticket XML showing the same selected line in `ticket-selection-line` and selected outcome label. | Pass |
| LD-DR-C-P0-03 | P0 | Selected period must carry through: `Reg. Time`, `1st Half`, and `2nd Half` selections must not collapse into the default period when opening the ticket. | Android proof for at least one non-default period, with row state and ticket target both showing the period. | Pass |
| LD-DR-C-P0-04 | P0 | Selected side/outcome must carry through: Yes/No or Over/Under/team subject must match the tapped row, including subject flips caused by line changes. | Ticket XML must show the side and outcome in `ticket-contract-outcome-row` and `ticket-selected-outcome-choice`; screenshot must visibly agree. | Pass |
| LD-DR-C-P0-05 | P0 | Odds/probability must come from the selected market/line/period/outcome, not stale row state. If the reference-style selected line changes prices, the ticket must reflect the selected row's odds/probability. | Android screenshot/XML and/or proof JSON showing row odds/probability before tap and ticket odds/probability after tap for Spread and Totals. | Pass |
| LD-DR-C-P0-06 | P0 | Ticket target identity must preserve selected market family, line, period, side/outcome, event, provider/source identity where available, and order target through amount entry/ready state. | Clean Android ticket proof after entering an amount, plus XML/proof JSON showing the selection fields used by the order payload or service layer. | Pass for ready state; amount-entry/swipe remains P1 because reference was location-gated |
| LD-DR-C-P0-07 | P0 | Android visible proof must be clean: screenshots and XML must be committed, device/harness result must be pass, and artifacts must be under a DR-C-owned cycle path. | `docs/mobile/screenshots/cycle-DR-C-*`, `docs/mobile/harness/cycle-DR-C-*`, and a proof summary with passing smoke/test results. | Pass |

## Decision

- Pass/fail: Pass for focused line-market ticket target parity.
- Unresolved P0 gaps for this focused gate: 0.
- Remaining P1/P2 gaps: DQ-C ticket amount/swipe confirmation recapture remains P1 because the official Polymarket S23 reference was location-gated at `Location verification failed`; full Book/order/portfolio/history coupling remains tracked under PM-GAP-074.
- Next required evidence: a separate cycle should prove line selection through Book selector, order creation, Portfolio, and history before PM-GAP-074 can pass.

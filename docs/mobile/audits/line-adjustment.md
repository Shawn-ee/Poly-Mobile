# Line Adjustment Polymarket Audit

Status: Cycle Y P0 pass for focused Spreads/Totals adjustable-line scope.

## Scope

Audit line-based markets:

- Spreads/handicaps.
- Totals/over-under.
- Team totals.
- Corners.
- First half and second half line markets.
- Other discovered line-based markets.

## Reference Audit

Reference device:

- Samsung S23.

Polymarket app/browser:

- Polymarket mobile web.

Route or URL if available:

- `https://polymarket.com/event/fifwc-usa-bel-2026-07-06-first-to-score`

Screenshots/UI hierarchy:

| Market type | Action | Polymarket result | State/data change | Screenshot |
| --- | --- | --- | --- | --- |
| Spread | View baseline line card | Polymarket shows a `Spreads REG TIME` card with `$22.7K Vol.`, two outcome buttons, and a horizontal rail with arrows and selectable lines. Baseline selection shows `USA -1.5 17c` and `BEL +1.5 84c`. | Selected spread line is part of the market identity and controls outcome labels/prices. | `docs/mobile/reference/screenshots/cycle-Y-polymarket-lines-market-list.png` |
| Spread | Tap `2.5` on the line rail | Card updates to `USA -2.5 7c` and `BEL +2.5 94c`; rail center moves to `2.5`. | Outcome labels and prices update in place without leaving the event page. | `docs/mobile/reference/screenshots/cycle-Y-polymarket-spread-line-25.png` |
| Total | View baseline line card | Polymarket shows a `Totals REG TIME` card with `$110K Vol.`, two outcome buttons, and a horizontal rail. Baseline selection shows `O 2.5 55c` and `U 2.5 46c`. | Selected total line is part of the market identity and controls outcome labels/prices. | `docs/mobile/reference/screenshots/cycle-Y-polymarket-lines-market-list.png` |
| Total | Tap `3.5` on the line rail | Card updates to `O 3.5 34c` and `U 3.5 67c`; rail center moves to `3.5`. | Outcome labels and prices update in place without leaving the event page. | `docs/mobile/reference/screenshots/cycle-Y-polymarket-totals-line-35.png` |
| Team total | Discover/change line | Not completed in this focused cycle. | Track as P1/P2 until a same-cycle Polymarket reference and Holiwyn proof cover it. | Pending |
| Corners | Discover/change line | Not visible in the focused captured page slice. | Track as discovered-later gap. | Pending |
| Half market | Discover/change line | Not completed in this focused cycle. | Track as P1/P2 until a same-cycle Polymarket reference and Holiwyn proof cover it. | Pending |
| Other discovered | Discover/change line | `Both Teams to Score? REG TIME` is visible under Totals but was not adjusted in this focused cycle. | Track as future market-card parity work. | `docs/mobile/reference/screenshots/cycle-Y-polymarket-totals-line-35.png` |

Reference evidence:

- `docs/mobile/reference/screenshots/cycle-Y-polymarket-lines-entry.png`
- `docs/mobile/reference/screenshots/cycle-Y-polymarket-lines-entry.xml`
- `docs/mobile/reference/screenshots/cycle-Y-polymarket-lines-market-list.png`
- `docs/mobile/reference/screenshots/cycle-Y-polymarket-lines-market-list.xml`
- `docs/mobile/reference/screenshots/cycle-Y-polymarket-spread-line-25.png`
- `docs/mobile/reference/screenshots/cycle-Y-polymarket-spread-line-25.xml`
- `docs/mobile/reference/screenshots/cycle-Y-polymarket-totals-line-35.png`
- `docs/mobile/reference/screenshots/cycle-Y-polymarket-totals-line-35.xml`

## Holiwyn Criteria

| ID | Priority | Criterion | Audit method | Result |
| --- | --- | --- | --- | --- |
| LA-P0-01 | P0 | Polymarket line selector behavior is audited for focused supported line markets before Holiwyn completion. | Reference audit | Pass for Spreads/Totals |
| LA-P0-02 | P0 | Holiwyn exposes selectable line sets where Polymarket exposes selectable line sets for Spreads and Totals. | Screenshot/device smoke | Pass |
| LA-P0-03 | P0 | Changing a line updates row prices/probabilities and selected market identity for Spreads and Totals. | Device smoke/state test | Pass |
| LA-P0-04 | P0 | Ticket preserves changed line, market type, and outcome for Spreads and Totals. | Device smoke | Pass |
| LA-P0-05 | P0 | Portfolio/open order/history line identity remains covered by existing line portfolio proof but was not rerun in this focused Cycle Y. | Device smoke/API test | Deferred to portfolio/open-order cycle |
| LA-P1-01 | P1 | Long-tail line markets discovered in Polymarket are prioritized and tracked. | Gap tracker | Deferred |

Holiwyn proof:

- `docs/mobile/screenshots/cycle-current-holiwyn-line-adjustment-baseline.png`
- `docs/mobile/harness/cycle-current-holiwyn-line-adjustment-baseline.xml`
- `docs/mobile/harness/cycle-current-holiwyn-line-adjustment-spread-25.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-line-adjustment-spread-25-1h.png`
- `docs/mobile/harness/cycle-current-holiwyn-line-adjustment-spread-25-1h.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-line-adjustment-spread-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-line-adjustment-spread-ticket.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-line-adjustment-totals-35-2h.png`
- `docs/mobile/harness/cycle-current-holiwyn-line-adjustment-totals-35-2h.xml`
- `docs/mobile/screenshots/cycle-current-holiwyn-line-adjustment-totals-ticket.png`
- `docs/mobile/harness/cycle-current-holiwyn-line-adjustment-totals-ticket.xml`

Verification:

- `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -EventDetailLineAdjustment -Port 8196`

## Audit Gate

Result: Pass for focused Spreads/Totals adjustable-line scope.

Unresolved P0 gaps: 0 for focused Spreads/Totals scope.

Remaining P1/P2 gaps:

- Team total line selectors need same-cycle Polymarket reference and Holiwyn proof.
- Halves-specific adjustable line cards need same-cycle reference and proof.
- Corners and any other discovered line market types need discovery/reference.
- Backend-provided line market groups, prices, depth, and history remain missing.

Recommended next cycle:

- Continue game-page parity with trade ticket behavior or a deeper line-market backend/data contract cycle.

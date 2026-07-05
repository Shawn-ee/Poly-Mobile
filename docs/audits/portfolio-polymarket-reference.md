# Portfolio Polymarket Reference Audit

## Reference

User-provided Polymarket mobile screenshots show the Portfolio page as a simple full-screen account/value surface:

- profile avatar, username, and settings control at the top;
- large portfolio value;
- green profit/loss line with separate cash amount;
- green performance chart;
- range selector: `1D`, `1W`, `1M`, `All`;
- Deposit and Withdraw buttons shown as large controls;
- tabs: Positions, Orders, History;
- Positions tab shows compact live position rows with event score/clock, outcome, cost/to-win/entry, current value, chance, Cash out, and plus/add control;
- Orders tab shows a centered empty state when there are no open orders;
- History tab shows compact activity rows with icon, outcome/action, event title, amount, and time.

Deposit/withdraw behavior is not implemented for Holiwyn MVP. The buttons are visual placeholders only.

## Holiwyn Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Portfolio top section uses profile + large total value + P/L/cash line instead of card-heavy fake balance/count tiles. | P0 | Android screenshot/XML. |
| Portfolio shows a green performance chart and range selector. | P0 | Android screenshot/XML. |
| Deposit/Withdraw controls are visible but do not implement real money movement. | P0 | Android screenshot/XML and docs. |
| Positions, Orders, and History are real tabs; only the selected section is primary on-screen. | P0 | Android tap proof or XML. |
| Position rows are compact and closer to Polymarket: outcome/event, cost/to-win/entry, value/chance, Cash out, and plus action. | P0 | Android order-to-Portfolio proof. |
| Orders empty state says no open orders when there are none. | P1 | Android tab proof. |
| History rows are visually simpler and list activity without the old dashboard cards. | P1 | Android tab proof. |
| Exact Polymarket chart path, avatar gradient, logo watermark, and transitions. | P2 | Deferred polish. |

## Cycle FQ Result

- Implementation: `Portfolio` now uses a profile/value/chart/action/tabs structure with compact Positions, Orders empty state, and History rows.
- Backend/API impact: none expected. Portfolio uses existing local/server state and order identity fields.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -LocalMvpSellFlow -Port 8227`.
- Audit status: P0 pass. Remaining gaps are tracked as P1/P2: app-shell header difference, deterministic chart data, and exact visual polish.

## Cycle FY Reference Refresh

User-provided Polymarket screenshots on July 4, 2026 show the Portfolio page still needs tighter visual density:

- the profile avatar should read as a soft gradient circle, not a flat badge;
- the chart should stay clean by default and show value readout only after touch;
- the range selector should share the row with a faint branded watermark;
- position rows should avoid visible internal debug/proof pills and should show score/live time, flag, Yes/No badge, cost/to-win/entry, current value/chance, Cash out, and plus action;
- Orders should keep a centered `No open orders` empty state;
- History should be simple rows with an icon, action/outcome, event, amount, and time, with execution/debug details hidden from the default visual row.

## Cycle FY Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Portfolio header shows gradient avatar, username, settings, large value, P/L, and cash line without the old app-shell promo header. | P0 | Android screenshot/XML. |
| Performance chart is clean by default; touch still reveals a value readout for inspection. | P0 | Android screenshot/XML after chart tap. |
| Range selector and Holiwyn watermark occupy the same row, matching the reference structure while avoiding Polymarket branding. | P0 | Android screenshot/XML. |
| Position row hides internal proof/status details from the visible row while preserving order identity in accessibility labels. | P0 | Android screenshot/XML and hierarchy. |
| Position and History rows use flag/icon-style leading visuals and simplified text hierarchy. | P0 | Android screenshot/XML. |
| Deposit/Withdraw remain placeholders only; no funding flow is implemented. | P0 | Android screenshot/XML. |
| Exact native gradient, chart curve physics, and continuous drag tooltip. | P2 | Deferred polish. |

## Cycle FY Result

- Implementation: `Portfolio` now hides visible internal proof details from default rows, uses gradient/flag-style visual anchors, keeps the chart clean until touch, and adds a Holiwyn watermark beside the range selector.
- Backend/API impact: none. The cycle only changes mobile presentation and preserves existing Portfolio data contracts.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8236`.
- Audit status: P0 pass for Portfolio visual density in the local MVP buy-flow proof. Remaining P2 gaps are exact native gradient/chart physics and final pixel polish.

## Cycle GE Reference Refresh

User-provided Polymarket Portfolio screenshots on July 4, 2026 show the MVP Portfolio should stay focused on account value, tabs, positions, open orders, and history. Holiwyn should not expose funding controls in the current local MVP because deposits/withdrawals are explicitly out of scope.

## Cycle GE Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Portfolio keeps the Polymarket-like profile/value/chart/range/tabs structure. | P0 | Android screenshot/XML. |
| Deposit and Withdraw controls are hidden from the default MVP Portfolio surface. | P0 | Android hierarchy absence check. |
| Internal sync/proof state is not part of the visible Portfolio layout. | P0 | Android screenshot/XML. |
| Position rows show an event-derived score line instead of a hard-coded match label. | P0 | Android hierarchy expects `MEX 0 - ECU 0` after the local MVP trade proof. |
| Positions, Orders, and History tabs remain tappable and keep Polymarket-style content density. | P0 | Android tab proof. |
| Exact portfolio chart curve/drag physics and fully native avatar gradient remain polish. | P2 | Deferred. |

## Cycle GE Result

- Implementation: `Portfolio` now hides funding controls for the Local MVP, keeps sync status in a non-visible proof node, and derives the position score line from the traded event title instead of hard-coding `PAR 0 - FRA 0`.
- Backend/API impact: none. Portfolio still consumes the existing balance, position, order, activity, and value-history props.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8244 -OutputDir docs/mobile/screenshots/cycle-GE-portfolio-retail-tightening -HierarchyOutputDir docs/mobile/harness/cycle-GE-portfolio-retail-tightening`.
- Audit status: P0 pass for the Local MVP Portfolio retail surface. Remaining P2 gaps are exact native chart curve/drag physics and final pixel polish.

## Cycle GU - Wide Android Portfolio Column Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| On a wide Android proof device, Portfolio keeps a phone-like centered content column instead of stretching value, chart, tabs, positions, and history across the full tablet width. | P0 | Samsung tablet screenshot/XML. |
| Positions, Orders, and History tabs remain tappable and keep the selected line-market trade visible after submit. | P0 | Local MVP trade-flow smoke proof. |
| Portfolio Buy more and Cash out tickets still open from the position row after the layout constraint. | P0 | Local MVP trade-flow smoke proof. |
| Backend/API route changes are not required. | P0 | Code/docs review. |
| Exact native chart curve, avatar gradient, and final pixel polish remain P2. | P2 | Deferred. |

## Cycle GU Result

- Status: pass.
- Implementation: `Portfolio` constrains its scroll content to a centered phone-width column on wide Android screens.
- Backend/API impact: none. Existing balance, positions, open orders, activities, value history, and ticket handoff contracts are unchanged.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8260 -OutputDir docs/mobile/screenshots/cycle-GU-portfolio-phone-width-retail-flow -HierarchyOutputDir docs/mobile/harness/cycle-GU-portfolio-phone-width-retail-flow`.
- Audit status: P0 pass for the wide Android Portfolio column. Remaining P2 gaps are exact native chart curve, avatar gradient, and final pixel polish.

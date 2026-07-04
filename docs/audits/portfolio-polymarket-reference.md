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

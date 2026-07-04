# Bottom Navigation Portfolio Value Audit

## Reference

User-provided Polymarket Portfolio screenshots show the bottom navigation Portfolio item using the account value as the visible label, for example `$104`, while the tab remains the Portfolio destination.

## Holiwyn Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Bottom Portfolio tab shows a compact current account value instead of the static `Portfolio` label. | P0 | Android screenshot/XML. |
| The tab remains accessible and testable as the Portfolio destination. | P0 | Android XML includes `Portfolio` and `holiwyn-portfolio-tab`. |
| The value updates from existing local/server Portfolio state after a fake-token trade. | P0 | Local MVP trade proof. |
| The label fits within the tab on Android. | P1 | Android screenshot/XML. |
| Exact Polymarket tab icon, notification badge, and animation polish. | P2 | Deferred. |

## Cycle GA Result

- Implementation: `BottomTabs` now renders compact `accountPortfolioValue` on the Portfolio tab, while preserving `Portfolio` and `holiwyn-portfolio-tab` in the accessibility label.
- Backend/API impact: none. The value is derived from existing `accountPortfolioValue`.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8240`.
- Audit status: P0 pass. Remaining P2 work is exact tab icon/badge/animation polish.

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

## Cycle GY - Portfolio Tab Value And Label

The Local MVP Portfolio screenshot after Cycle GX showed the bottom Portfolio tab using only the account value (`$10K`) as visible text. The Polymarket reference keeps the value cue, but the destination remains clear as Portfolio. Holiwyn should therefore show both the compact value and the Portfolio label in the default bottom navigation.

| Criteria | Priority | Verification |
| --- | --- | --- |
| Portfolio bottom tab shows compact account value and the visible `Portfolio` label. | P0 | Samsung tablet screenshot/XML. |
| Accessibility still exposes `holiwyn-portfolio-tab`, `Portfolio`, and `portfolio-tab-value-*`. | P0 | Android XML. |
| Full Local MVP flow still reaches Portfolio, Buy more, Cash out, Orders, and History after the nav label change. | P0 | Local MVP trade-flow smoke proof. |
| Backend/API route changes are not required. | P0 | Code/docs review. |

## Cycle GY Result

- Status: pass.
- Implementation: `BottomTabs` renders the Portfolio tab as a two-line value-plus-label stack and exposes `portfolio-tab-label-visible` for proof.
- Backend/API impact: none. Existing local/server Portfolio state still provides `accountPortfolioValue`; no route, schema, request, or response changed.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File scripts\smoke-tablet.ps1 -LocalMvpTradeFlow -Port 8265 -OutputDir docs/mobile/screenshots/cycle-GY-portfolio-tab-value-label-retail-flow -HierarchyOutputDir docs/mobile/harness/cycle-GY-portfolio-tab-value-label-retail-flow`.
- Audit status: P0 pass.

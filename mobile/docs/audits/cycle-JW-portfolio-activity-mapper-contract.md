# Cycle JW - Portfolio Activity Mapper Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile Portfolio service-layer mapping for backend `/api/portfolio` and `/api/portfolio/history` payloads.
- Preserve backend `to_advance` selection identity through positions and recent activity.
- Aggregate backend multi-fill recent trades into one retail activity row when fills share an order id or execution window.
- No Portfolio visual redesign and no edits to dirty screen layout beyond tiny type fields required by the service contract.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Portfolio position mapper preserves backend advance-market identity | Pass | `mobile/src/__tests__/portfolioSnapshotService.test.ts` and `docs/mobile/harness/cycle-JW-portfolio-activity-mapper-contract/cycle-JW-portfolio-activity-mapper-contract.json`. |
| Portfolio history/activity mapper preserves backend advance-market identity | Pass | `mobile/src/__tests__/portfolioHistoryService.test.ts` and JW proof. |
| Multi-fill recent trades aggregate into one retail activity row | Pass | `mobile/src/__tests__/portfolioHistoryService.test.ts` covers order-id grouping and execution-window grouping. |
| Mapper keeps provider/selection metadata instead of falling back to generic labels | Pass | Tests and proof assert market id, outcome id, market group, type, period, side, display label, provider market/condition/token, and reference outcome labels. |
| The cycle does not redesign Portfolio UI | Pass | Scoped commit is service/tests/types/proof/docs only. |

## Change Notes

- Added `to_advance` to Portfolio mapper accepted market types so backend advance selections are not dropped.
- Grouped recent trades by backend `orderId` when available, otherwise by matching selection fields inside a short execution window.
- Exposed `fillCount` in Portfolio activity type so service output remains typed.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioHistoryService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts` - pass.
- `npx tsx scripts/prove_mobile_portfolio_activity_mapper_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle JW"` - pass.

## Remaining P1

- UI-level Portfolio history/position proof after dirty Portfolio screen churn is reconciled.
- Broader real-provider lifecycle repetition across more market families.

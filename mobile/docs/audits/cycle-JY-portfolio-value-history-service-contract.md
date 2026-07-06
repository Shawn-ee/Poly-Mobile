# Cycle JY - Portfolio Value History Service Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile service-layer loading for `/api/portfolio/value-history?range=...`.
- Prefer backend route data when an API client is available.
- Keep deterministic fallback only for offline/non-server mode.
- No Portfolio visual redesign and no edits to dirty Portfolio UI files.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Service can consume backend value-history route shape | Pass | `mobile/src/__tests__/portfolioValueHistoryService.test.ts` and `docs/mobile/harness/cycle-JY-portfolio-value-history-service-contract/cycle-JY-portfolio-value-history-service-contract.json`. |
| Service preserves route source marker | Pass | Tests/proof assert `source=portfolio-value-history-route` when API succeeds. |
| Offline fallback remains backend-shaped | Pass | Tests/proof assert deterministic fallback shape and point count. |
| Backend route contract remains covered | Pass | `src/__tests__/portfolio.value-history.route.test.ts`. |
| The cycle does not edit dirty Portfolio UI | Pass | Scoped commit is service/tests/proof/docs only. |

## Change Notes

- Added `loadPortfolioValueHistory()` to prefer the server route and fall back only when route loading is unavailable.
- Existing deterministic history remains available for non-server/fallback mode.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioValueHistoryService.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/portfolio.value-history.route.test.ts` - pass.
- `npx tsx scripts/prove_mobile_portfolio_value_history_service_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle JY"` - pass.

## Remaining P1

- Wire dirty Portfolio UI to `loadPortfolioValueHistory()` once unrelated screen churn is reconciled.
- Add Android proof that the Portfolio chart source changes to `portfolio-value-history-route` in server mode.

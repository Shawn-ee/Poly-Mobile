# Cycle KE - Portfolio Sync Route Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile Portfolio sync service reads both `/api/portfolio` and `/api/portfolio/history`.
- Backend route payloads map into visible Portfolio positions, open orders, canceled activities, and recent trade activities.
- No Portfolio visual redesign and no edits to dirty Portfolio screen files.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Portfolio sync reads the backend snapshot route | Pass | `mobile/src/__tests__/portfolioSyncService.test.ts` verifies `loadServerPortfolioState()` calls `getPortfolio()` and maps positions/open orders. |
| Portfolio sync reads the backend history route | Pass | The same test verifies `getPortfolioHistory()` is called and recent trades map to activity rows. |
| Backend route proof covers snapshot plus history together | Pass | `scripts/prove_mobile_portfolio_sync_contract.ts` seeds a disposable account and drives the mobile sync service through real `/api/portfolio` and `/api/portfolio/history` route handlers. |
| Selection identity survives route mapping | Pass | Proof verifies position, open order, canceled activity, and recent trade activity all preserve backend spread selection metadata. |
| Cycle avoids unrelated UI churn | Pass | No edits to `mobile/App.tsx`, `Portfolio.tsx`, deposits, withdraws, order book, chat, or live stats. |

## Change Notes

- Strengthened Portfolio sync service tests to prove both backend route dependencies are invoked.
- Added a focused route proof for combined Portfolio snapshot/history sync.
- Reused existing route contracts and schema; no backend schema migration was added.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioSyncService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/portfolio.open-orders.route.test.ts src/__tests__/portfolio.history.route.test.ts` - pass.
- `npx tsx scripts/prove_mobile_portfolio_sync_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle KE"` - pass.

## Remaining P1

- Wire dirty Portfolio UI files to `loadServerPortfolioState()` only after unrelated screen churn is reconciled.
- Optional Android proof can be recaptured later if visual proof becomes required again.

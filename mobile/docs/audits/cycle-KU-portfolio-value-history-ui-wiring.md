# Cycle KU - Portfolio Value History UI Wiring

Scope:

- Visible Portfolio performance chart data source in server mode.
- Route/service wiring for `GET /api/portfolio/value-history?range=1D|1W|1M|All`.
- No Portfolio visual redesign, deposits, withdrawals, order book, chat, or new chart styling.

| Requirement | Status | Evidence |
| --- | --- | --- |
| App uses the value-history service contract | Pass | `mobile/App.tsx` imports `loadPortfolioValueHistory` from `portfolioValueHistoryService` and passes API, range, cash, positions value, and PnL into it. |
| Server mode passes a route-backed loader to Portfolio | Pass | `Portfolio` receives `loadValueHistory` only when `ORDER_MODE=server` and a runtime API key is present. |
| Portfolio fetches the active range through the loader | Pass | `Portfolio` calls `loadValueHistory(activeRange)` and stores the returned history in `serverValueHistory`. |
| Visible chart exposes backend source/status metadata | Pass | `PortfolioSparkline` receives `displayedValueHistory.source` and `status`, exposing `portfolio-chart-source-*` and `portfolio-chart-status-*` proof markers. |
| Fallback remains isolated | Pass | `portfolioValueHistoryService` prefers the route and falls back deterministically only when the route is unavailable or invalid. |

Validation:

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/portfolioValueHistoryService.test.ts mobile/src/__tests__/api.test.ts`
- `npx jest --runInBand --detectOpenHandles src/__tests__/portfolio.value-history.route.test.ts`
- `npm run typecheck --prefix mobile`
- `npx tsc --noEmit`
- `npx tsx scripts/prove_mobile_portfolio_value_history_service_contract.ts`
- `npx tsx scripts/prove_mobile_portfolio_value_history_ui_wiring.ts`
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle KU"`

Gate status: Pass.

Remaining:

- P1 optional Android proof only if visual/device proof becomes required again.
- Persisted account-level value snapshots remain future backend hardening; current route reconstructs value history from wallet/positions/snapshots.

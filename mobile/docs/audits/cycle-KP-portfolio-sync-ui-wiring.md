# Cycle KP - Portfolio Sync UI Wiring

Gate status: Pass

Scope: Backend/data-contract gate for visible Portfolio state consuming `/api/portfolio` and `/api/portfolio/history` in server mode. This does not redesign Portfolio, add deposits/withdrawals, order book, chat, or live stats.

## P0 Checklist

- Visible Portfolio server mode calls `loadServerPortfolioState()` with the active API client.
- `loadServerPortfolioState()` reads both `/api/portfolio` and `/api/portfolio/history`.
- Route snapshot data drives visible balance, positions, and open orders.
- Route history data drives visible Portfolio activity/history rows.
- Partial route success preserves the last known local state only for the failed half instead of inventing mock data.
- Server order submit, cancel, and position close/cashout paths refresh Portfolio from the backend.
- The visible `Portfolio` component receives the route-backed `balance`, `positions`, `openOrders`, `activities`, and `syncStatus` props.

## Evidence

- Proof: `docs/mobile/harness/cycle-KP-portfolio-sync-ui-wiring/cycle-KP-portfolio-sync-ui-wiring.json`.
- Proof script: `scripts/prove_mobile_portfolio_sync_ui_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/api.test.ts`
  - `mobile/src/__tests__/portfolioSyncService.test.ts`
  - `mobile/src/__tests__/portfolioSnapshotService.test.ts`
  - `mobile/src/__tests__/portfolioHistoryService.test.ts`
  - `mobile/src/__tests__/portfolioStateApplyService.test.ts`
- Focused backend tests:
  - `src/__tests__/portfolio.open-orders.route.test.ts`
  - `src/__tests__/portfolio.history.route.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Portfolio sync UI route wiring.
- Remaining P1: optional Android proof if visual proof becomes required again; broader provider lifecycle breadth remains under provider lanes.

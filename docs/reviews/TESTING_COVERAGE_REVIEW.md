# Testing Coverage Review

## Current Coverage

CI currently runs:

```sh
npm ci
npm exec -- prisma generate --schema=prisma/schema.prisma
npm exec -- prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

The focused `test:ci` suite includes health, config, wallet balance, order ticket logic, orderbook event/cancel behavior, SSE, sports event model, sensitive rate limit, admin withdrawals completion, and admin market invariants.

Additional tests exist for:

- Broad Jest tests in `src/__tests__`.
- Service tests under `src/server/services/__tests__`.
- Playwright e2e tests under `tests/e2e`.
- Bot e2e assets under `tests/bot-e2e`.
- Simulation and reconciliation scripts under `scripts`.

## Strengths

- CI has a stable first phase.
- Prisma generate/validate and TypeScript are required.
- Important smoke tests are already selected.
- There are tests for ledger phase 3, withdrawals, canonical API, ops reconciliation, orderbook invariants, and sports model outside the focused CI command.

## Gaps

- `docs/TESTING.md` is stale about CI trigger branches.
- Broad Jest and Vitest suites are not unified under a stable required command.
- Playwright is not in CI yet.
- Wallet/deposit/withdrawal UI is not covered by e2e smoke.
- Admin route authorization coverage is incomplete relative to route count.
- Settlement/resolution needs more invariant tests.
- Balance reconciliation is not required in CI.
- Deposit monitor tests should cover duplicate logs, confirmations, ignored small deposits, and rescan behavior.
- Bot package CI is not active; `poly-bot` is not present in the checkout despite task-board references.

## Pages That Need Playwright Coverage

Priority 1:

- `/`
- `/markets`
- `/markets/[id]` with order ticket visible
- `/events/[slug]` sports event
- `/sports`
- `/sports/soccer/world-cup`
- `/wallet` beta state
- `/portfolio`
- `/login`

Priority 2 admin/internal:

- `/admin`
- `/admin/deposits`
- `/admin/withdrawals`
- `/admin/system`
- `/admin/reference-markets`
- `/admin/bots`
- `/admin/agents`
- `/admin/markets/[marketId]/invariants`

## APIs That Need Jest/Integration Coverage

- All admin market mutation routes.
- All admin withdrawal routes.
- Deposit address, status, verify, and admin rescan routes.
- Order placement and cancellation routes, including canonical and legacy variants.
- Portfolio/account balance/positions routes.
- API key creation, revocation, policy update, and scoped order submission.
- Sports event route filters.
- Agent dashboard routes for admin-only access.

## Ledger/Trading Invariant Tests Needed

- Available and locked balances never negative.
- Every balance change has a ledger entry.
- Ledger deltas reconcile to `UserBalance`.
- Order lock/release/fill paths are idempotent.
- Partial fill then cancel releases exact remainder.
- Sell orders reserve and release shares correctly.
- Settlement conserves collateral.
- Resolution cannot run twice with different outcomes.
- Admin cancellation refunds correctly.

## Admin Flow Tests Needed

- Unauthorized and forbidden for every `/api/admin/**` route.
- Admin market create/edit/pause/close/cancel/resolve success and failure.
- Admin withdrawal complete requires tx hash.
- Admin withdrawal reject unlocks funds.
- Admin deposit rescan requires admin.
- Admin reference-market import/seed-bot requires admin or internal key as designed.

## CI Recommendations

Phase 1 already exists and should remain required.

Next required checks:

1. `npm run test:ci` plus updated admin auth route tests.
2. Balance reconciliation smoke against seeded test database.
3. Withdrawal request/reject/complete integration smoke.
4. Deposit monitor dry-run/fixture smoke.
5. Playwright public smoke once stable.
6. Bot dry-run risk-control tests once bot package location is resolved.

## Before UI Redesign

Add smoke tests that lock down:

- Public pages render without 500.
- Sports pages render event cards or expected empty state.
- Market detail renders the trade ticket or disabled state.
- Wallet renders beta-disabled funding state.
- Portfolio renders empty state for new user.
- Admin pages reject non-admin access.

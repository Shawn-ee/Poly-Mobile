# Market Chart Public Boundary Review

Task id: DOC-011
Assigned subagents: TestingAgent, SecurityAgent, BackendAgent
Risk level: Medium
Status: Docs-only boundary review

## Purpose

This review explains why `/api/markets/[id]/chart` should be classified before broad public no-leak or response-shape tests are added.

The route is read-only and likely safe to test later with mocks, but it calls auth and market visibility guards. It should be treated as auth-aware public/private market data rather than a simple anonymous public route until the contract is explicit.

This document does not change route behavior, tests, chart data, auth behavior, product code, Prisma, wallet, ledger, trading, bots, deployment, or production settings.

## Current Route Observations

Current route file:

- `src/app/api/markets/[id]/chart/route.ts`

Observed behavior from source inspection:

- Calls `getUserId()`.
- Parses `range` query parameter.
- Loads market outcomes.
- Returns 404 when the market is missing.
- Calls `assertMarketVisibleToUser({ market, userId })`.
- Loads `marketOutcomeSnapshot` rows for the selected range.
- Caps snapshots to the latest 5000.
- Returns `marketId`, outcome ids/names, and time-series prices by outcome id.

## Boundary Concern

The route is display-focused, but its visibility is market-access aware. Future tests should not accidentally assume:

- Every chart is anonymous-public.
- Private/hidden market charts are public.
- Snapshot retention/capping behavior is the final public contract.
- Time-series outcome ids are sufficient for frontend display without labels or statuses.

## Safe Future Test Scope

Future low-risk tests may be possible if they:

- Mock auth.
- Mock `assertMarketVisibleToUser`.
- Mock Prisma market and snapshot reads.
- Use local fixture snapshots only.
- Assert no sensitive keys are present.
- Verify empty series behavior.
- Verify range filtering constructs safe Prisma queries.

Future tests should avoid:

- Real database reads.
- Real user sessions.
- Private market data.
- Production snapshots.
- Trading mutation routes.
- Balance, ledger, order, fill, trade, position, settlement, wallet, deposit, or withdrawal data.

## Fields And Behaviors Needing Contract Decision

Future public contract work should decide:

- Allowed range values and fallback behavior.
- Whether chart response should include outcome labels/codes/statuses.
- Whether chart response should include stale/unavailable state.
- Whether snapshot capping should be documented.
- Whether chart reads should be fully anonymous for public markets or auth-aware for mixed visibility.

## Review Requirements

Future implementation tests require:

- TestingAgent review for route-test isolation.
- SecurityAgent review for auth/visibility assumptions.
- BackendAgent review for chart response contract.
- LedgerWalletReviewerAgent review only if tests begin touching positions, orders, balances, ledger, settlement, or collateral.

## Non-Goals

This review does not:

- Add tests.
- Change `/api/markets/[id]/chart`.
- Change auth or market visibility.
- Change chart snapshots.
- Change wallet, ledger, matching, settlement, orders, fills, trades, positions, admin auth, bots, deployment, Prisma, migration, or production behavior.

## Validation For This Review

This review is docs-only. Validation for this PR should be:

```bash
git diff --check
```

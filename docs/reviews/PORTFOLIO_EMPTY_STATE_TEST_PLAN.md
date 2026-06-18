# Portfolio And Account Empty State Test Plan

Task id: ACC-004
Assigned subagents: TestingAgent, PlannerAgent, LedgerWalletReviewerAgent
Risk level: Medium by topic
Status: Docs-only test plan

## Purpose

This plan defines future tests for portfolio and account empty states. It does not add tests, change portfolio UI, change account APIs, or alter wallet, ledger, balance, order, position, matching, settlement, deposit, or withdrawal behavior.

## Target States

Future tests should cover:

- Signed-out portfolio.
- Logged-in account with no positions.
- Logged-in account with no open orders.
- Logged-in account with no activity.
- Balance unavailable.
- Positions unavailable.
- Open orders unavailable.
- Resolved history empty.

## Expected UX Assertions

Future UI tests should verify:

- Signed-out state points to login and browse markets.
- Empty portfolio points to sports/market discovery.
- No active funding CTA appears unless funding is approved.
- Available and locked balance labels are distinct.
- Unavailable values are not shown as misleading zeroes.
- Admin, bot, ledger, and internal operational terms are absent from normal user empty states.

## Future Test Types

Recommended sequence:

1. Component or unit tests for empty-state formatting if components are isolated.
2. API-mocked page tests if available.
3. Playwright smoke after route/UI stabilizes.

Do not add production-data or live-service dependencies.

## Required Validation For Future Test PR

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

## Forbidden Scope

Future work must not change:

- Portfolio calculations.
- Account balance APIs.
- Ledger entries.
- Locked balance behavior.
- Order/fill/position logic.
- Deposit/withdrawal behavior.
- Prisma schema or migrations.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```

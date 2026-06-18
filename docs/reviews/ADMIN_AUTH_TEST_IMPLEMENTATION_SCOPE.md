# Admin Auth Test Implementation Scope

Task id: TST-014
Assigned subagents: TestingAgent, SecurityAgent
Risk level: High by topic
Status: Docs-only implementation scope

## Purpose

This document narrows the future implementation scope for admin auth tests. It converts the planning intent in `docs/reviews/ADMIN_AUTH_TEST_MATRIX.md` into explicit safe and forbidden boundaries for a later test-only PR.

This scope does not add tests, modify admin auth, modify middleware, change admin routes, alter financial operations, change bot behavior, touch Prisma, deploy, or change production settings.

## First Implementation Goal

The first admin auth test implementation should prove that selected admin read surfaces reject unauthorized users and allow admins without exercising high-risk mutations.

The first implementation PR should be test-only and should target one small route group.

## Candidate First Route Group

Preferred first candidate:

- A read-only admin status or inventory route that does not mutate markets, deposits, withdrawals, settlement, bots, credentials, or deployment state.

Avoid as first candidates:

- `/api/admin/deposits`
- `/api/admin/deposits/rescan`
- `/api/admin/withdrawals`
- `/api/admin/withdrawals/[id]/complete`
- `/api/admin/withdrawals/[id]/reject`
- `/api/admin/markets/*/resolve`
- `/api/admin/reference-markets/*/seed-bot`
- Any bot live-control route
- Any route requiring production config or real credentials

## Required Auth Cases

Future tests should cover:

- Signed-out request is rejected.
- Signed-in non-admin request is rejected.
- Signed-in admin request is accepted for read-only scope.
- Response body does not expose secrets, private keys, production config, or sensitive logs.

## Safe Mocking Pattern

Future tests should mock:

- Session/user lookup.
- Admin role lookup.
- Prisma reads.
- Any file, log, config, or status helper.

Mocks must use local fixture data only. They must not load real `.env` contents, production config, deployment credentials, or wallet/private-key material.

## Forbidden Future Test Behavior

Admin auth tests must not:

- Change auth implementation.
- Change middleware.
- Change admin route behavior.
- Invoke deposit rescan.
- Complete or reject withdrawals.
- Resolve markets.
- Pause, close, cancel, or mutate markets.
- Seed bots.
- Start bots.
- Import live reference markets.
- Read production secrets.
- Print environment variables.
- Call real external services.
- Mutate production or staging data.

## Auto-Merge Policy

Future admin auth implementation tests are not auto-mergeable by default in the current agent policy because admin auth is high-risk.

A future test-only PR may be left open for human review even if:

- Changed files are test-only.
- Full validation passes.
- ReviewerAgent and SecurityAgent self-review pass.

Docs-only planning scopes like this document may be auto-merged after internal self-review because they do not change behavior.

## Required Validation For Future Test PR

Future implementation PRs should run:

```bash
git diff --check
npx jest --runInBand --detectOpenHandles <new-test-file>
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

If a test needs Playwright or a dev server, keep that work in a separate human-reviewed PR.

## Review Requirements

Future implementation PRs require:

- TestingAgent review for test isolation.
- SecurityAgent review for auth semantics and no-secret exposure.
- LedgerWalletReviewerAgent review if a route touches deposits, withdrawals, settlement, invariants, balances, or financial admin operations.
- BotAgent review if a route touches bot, reference-market, seed, import, or live-control behavior.
- DeploymentAgent review if a route touches system, config, logs, process status, or deployment state.

## Acceptance Criteria For Future First Test PR

A future first implementation PR should:

- Test only one low-mutation admin route group.
- Mock auth/session state.
- Mock data access.
- Avoid production config and secrets.
- Avoid financial, bot, deployment, and market mutation routes.
- Document why the route group was selected.
- Leave behavior fixes for separate human-reviewed PRs if tests reveal a gap.

## Non-Goals

This scope does not:

- Add tests.
- Change admin auth.
- Change admin UI.
- Change admin APIs.
- Change wallet, deposit, withdrawal, ledger, matching, settlement, market resolution, bot, deployment, Prisma, migration, or production behavior.

## Validation For This Scope

This scope is docs-only. Validation for this PR should be:

```bash
git diff --check
```

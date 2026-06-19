# Public No-Leak CI Promotion Readiness

Task id: DOC-027

Phase: Phase C - Public API test lane readiness

Assigned subagents: TestingAgent, SecurityAgent, DeploymentAgent

Risk level: Medium by CI impact, docs-only in this task

## Purpose

This document defines the readiness gate for promoting public no-leak and response-shape tests into an optional `test:public-api` lane or required CI.

This task does not change `package.json`, GitHub Actions, scripts, tests, product code, routes, Prisma, wallet, ledger, trading, admin auth, bots, deployment, or production behavior.

## Current Public Test Evidence

Current targeted public/read-only evidence:

- `src/__tests__/public.taxonomy.no-leak.test.ts`
- `src/__tests__/public.events.no-leak.test.ts`
- `src/__tests__/public.sports.no-leak.test.ts`
- `src/__tests__/public.market-list.no-leak.test.ts`
- `src/__tests__/public.event-markets.no-leak.test.ts`
- `src/__tests__/public.market-chart.no-leak.test.ts`

These tests are useful targeted evidence, but they are not yet included in `npm run test:ci`.

## Readiness Criteria

Public no-leak tests may be proposed for an optional `test:public-api` command only after all of the following are true:

1. The public route status rollup is current.
2. Market detail is either covered by a reviewed target contract or explicitly deferred.
3. Reference/liquidity routes are either split into public/admin surfaces or explicitly deferred.
4. Quote/orderbook/trade-tape routes are explicitly excluded or reviewed as trading-adjacent.
5. The proposed command runs only mocked/local tests.
6. The proposed command does not require a real database, production data, secrets, chain RPC, external APIs, login credentials, admin credentials, wallet keys, bots, or money movement.
7. The proposed command passes repeatedly on local Windows.
8. The proposed command is documented in `docs/TESTING.md`.
9. SecurityAgent confirms no sensitive fields are expected or exposed.
10. DeploymentAgent confirms the added command does not slow required CI beyond an acceptable threshold.

## Promotion Steps

Recommended sequence:

1. Keep targeted public tests as manually reported validation in PRs.
2. Add an optional `test:public-api` package script in a separate PR.
3. Run the optional lane locally and in at least one GitHub PR.
4. Expand docs with expected runtime and known exclusions.
5. Only later consider adding the lane to required CI.

## Non-Auto-Merge Boundary

The following PR types are not auto-mergeable:

- `package.json` changes
- `.github/workflows/` changes
- executable validation script changes
- required CI behavior changes

These PRs may be opened by agents, but they must remain open for human review.

## Required Validation For A Future Package/Workflow PR

Future implementation PRs should run:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
npm run test:public-api
git diff --cached --check
```

If `npm run test:public-api` is introduced, the PR must document its exact file list and runtime.

## Exclusions

Do not include tests for these areas in an auto-merged public no-leak lane:

- wallet
- deposit
- withdrawal
- ledger
- matching
- settlement
- order placement
- order cancellation
- fills
- trades
- positions
- admin auth
- bot runtime
- liquidity runtime
- deployment
- Prisma schema or migrations
- production config or secrets

## Decision

Do not promote public no-leak tests into `npm run test:ci` yet. Prepare an optional lane only after the readiness criteria above are satisfied, and leave package/workflow implementation PRs for human review.

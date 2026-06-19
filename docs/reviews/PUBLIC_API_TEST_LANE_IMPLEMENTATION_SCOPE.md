# Public API Test Lane Implementation Scope

Task id: DOC-034

Phase: Phase C - Public API test lane readiness

Assigned subagents: TestingAgent, SecurityAgent, DeploymentAgent

Risk level: Medium by package/CI topic, docs-only in this task

## Purpose

This document scopes a future optional `test:public-api` lane without changing `package.json`, workflows, scripts, tests, or CI in this task.

The future implementation PR must remain human-reviewed because it will likely change `package.json`.

## Proposed Optional Lane

Future script name:

```bash
npm run test:public-api
```

Suggested command shape:

```bash
jest --runInBand --detectOpenHandles \
  src/__tests__/public.taxonomy.no-leak.test.ts \
  src/__tests__/public.events.no-leak.test.ts \
  src/__tests__/public.sports.no-leak.test.ts \
  src/__tests__/public.market-list.no-leak.test.ts \
  src/__tests__/public.event-markets.no-leak.test.ts \
  src/__tests__/public.market-chart.no-leak.test.ts
```

The exact command should be verified in the implementation PR before commit.

## Required Implementation PR Scope

A future implementation PR may touch:

- `package.json`
- `docs/TESTING.md`
- `docs/reviews/PUBLIC_NO_LEAK_CI_PROMOTION_READINESS.md` if status needs updating
- `docs/reviews/AUTONOMOUS_EXECUTION_STATE.md` if state needs updating

It must not touch:

- `.github/workflows/` in the first optional-lane PR
- route implementation files
- `src/app/`
- `src/components/`
- Prisma schema or migrations
- wallet, ledger, matching, settlement, trading, admin auth, bot, deployment, or production config files
- secrets or env files

## Required Validation

Future implementation PR must run:

```bash
git diff --check
npm run test:public-api
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

## Auto-Merge Decision

Do not auto-merge the future implementation PR.

Reason:

- It changes `package.json`.
- It affects developer validation behavior.
- It should be reviewed by TestingAgent, SecurityAgent, DeploymentAgent, and a human.

## Required PR Body Evidence

The future PR body must include:

- Exact script added.
- Exact file list covered.
- Runtime observed locally.
- Confirmation no tests require real DB, secrets, external services, production data, chain RPC, credentials, wallet keys, bots, or money movement.
- Confirmation no required CI workflow changed.
- Validation results.

## CI Promotion Boundary

Adding optional `test:public-api` is not the same as adding it to required CI.

Required CI promotion needs a later PR and human review because it would touch `.github/workflows/` or required check policy.

## Decision

The next implementation step may be an optional `test:public-api` package script PR, but it must be left open for human review. Autonomous LeadAgent may prepare it, validate it, and report it, but must not merge it.

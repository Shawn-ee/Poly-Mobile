# Public API Test Lane Decision

Task id: DOC-016
Assigned subagents: TestingAgent, SecurityAgent, DeploymentAgent
Risk level: Medium
Status: Docs-only test-lane decision

## Purpose

This decision records what to do with the targeted public no-leak tests added during the recent test wave.

It follows `docs/reviews/PUBLIC_NO_LEAK_TEST_LANE_PROMOTION_PLAN.md`, `docs/reviews/PUBLIC_API_NO_LEAK_COVERAGE_MAP.md`, and `docs/TESTING.md`.

This document does not change `package.json`, GitHub Actions, CI, tests, scripts, product code, Prisma, wallet, ledger, matching, settlement, admin auth, bots, deployment, or production settings.

## Decision

Keep the current public no-leak tests as targeted evidence for now.

Do not add a `test:public-api` package script in this cycle.

Do not promote the targeted public no-leak tests into `npm run test:ci` in this cycle.

## Rationale

The current targeted tests are useful and passing, but the public read surface still has boundary decisions in progress:

- Market detail target public contract was just defined.
- Reference liquidity should split public summary from admin diagnostics.
- Chart response shape was just defined.
- Quote, orderbook, and trade-tape reads remain trading-adjacent.

Promoting the test lane before those decisions are implemented could lock in incomplete or transitional route behavior.

## Current Targeted Evidence

Targeted public no-leak test files:

- `src/__tests__/public.taxonomy.no-leak.test.ts`
- `src/__tests__/public.events.no-leak.test.ts`
- `src/__tests__/public.sports.no-leak.test.ts`
- `src/__tests__/public.market-list.no-leak.test.ts`
- `src/__tests__/public.event-markets.no-leak.test.ts`

These tests should continue to be run explicitly in PRs that modify related public read route contracts.

## Future Promotion Criteria

A future PR may propose a `test:public-api` script or `test:ci` expansion after:

1. Public route boundary decisions are reviewed.
2. Market detail, reference, chart, quote, orderbook, and trade-tape route groups are either covered or explicitly deferred.
3. The chosen test command passes repeatedly on local Windows and GitHub Actions.
4. Runtime impact is documented.
5. The PR changes only package/workflow/test documentation files authorized by the task.
6. SecurityAgent confirms no tests require real secrets, production data, external credentials, wallet keys, live bots, or money movement.
7. DeploymentAgent confirms CI impact is acceptable.

## Preferred Future Shape

Preferred future option:

- Add `npm run test:public-api` for public read/no-leak tests.
- Keep it optional first.
- Promote it into required CI only after multiple green runs.

Avoid mixing this promotion with new route test additions.

## Human Review Required

Human review is required for future PRs that change:

- `package.json`
- `.github/workflows/`
- executable validation scripts
- required CI checks
- tests touching auth, wallet, ledger, matching, settlement, orders, fills, trades, positions, admin, bot, deployment, Prisma, migrations, production data, or secrets

## Non-Goals

This decision does not:

- Add package scripts.
- Change CI.
- Add tests.
- Change route behavior.
- Change public contracts.
- Change product/runtime behavior.

## Validation For This Decision

This decision is docs-only. Validation for this PR should be:

```bash
git diff --check
```

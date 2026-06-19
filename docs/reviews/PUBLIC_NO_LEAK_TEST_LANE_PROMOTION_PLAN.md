# Public No-Leak Test Lane Promotion Plan

Task id: DOC-008
Assigned subagents: TestingAgent, DocsAgent, SecurityAgent
Risk level: Low
Status: Docs-only promotion plan

## Purpose

Several targeted public no-leak tests now exist, but they are not yet part of `npm run test:ci`. This plan defines safe options for promoting those tests into a stable lane later without changing package scripts, CI, or workflows in this PR.

This document does not change tests, package scripts, CI, workflows, route behavior, auth, wallet, ledger, matching, settlement, bots, deployment, Prisma, migrations, or production behavior.

## Current State

Current targeted public no-leak tests:

- `src/__tests__/public.taxonomy.no-leak.test.ts`
- `src/__tests__/public.events.no-leak.test.ts`
- `src/__tests__/public.sports.no-leak.test.ts`
- `src/__tests__/public.market-list.no-leak.test.ts`
- `src/__tests__/public.event-markets.no-leak.test.ts`

Current required CI remains:

```bash
npm ci
npm exec -- prisma generate --schema=prisma/schema.prisma
npm exec -- prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

## Promotion Options

### Option A: Add Selected Tests To `test:ci`

Pros:

- Strongest required signal.
- Keeps one command for agent validation.
- Ensures no-leak tests run on every dev/main PR.

Cons:

- Requires `package.json` change.
- Expands required CI runtime.
- Should be human-reviewed because it changes validation behavior.

Recommended timing: after the public no-leak suite is stable across multiple local and GitHub runs.

### Option B: Add `test:public-api`

Pros:

- Creates a focused lane for public read/no-leak tests.
- Easier to expand without overloading `test:ci`.
- Can become optional before becoming required.

Cons:

- Requires `package.json` and possibly CI changes.
- Agents must remember an additional command until CI enforces it.

Recommended timing: after at least taxonomy, event, sports, market list, event market, and one chart/reference-safe route are covered or explicitly deferred.

### Option C: Keep Targeted Evidence Only

Pros:

- No CI/package-script churn.
- Good while route contracts are still moving.
- Keeps low-risk test PRs small.

Cons:

- Tests may be forgotten unless future agents run them.
- Does not provide automatic regression protection.

Recommended timing: current state.

## Recommended Near-Term Decision

Keep the current targeted-test evidence model for now.

Do not change `package.json` or GitHub Actions in the current wave. Revisit promotion after:

- Public no-leak coverage map is reviewed.
- Market detail, chart, reference, quote, orderbook, and trade-tape boundaries are classified.
- At least one GitHub Actions run has passed after the current test wave.

## Future Promotion PR Scope

A future promotion PR should:

- Change only `package.json`, docs, and possibly CI if explicitly approved.
- Add a single command or limited `test:ci` expansion.
- Run full validation.
- Explain runtime impact.
- Remain separate from adding new route tests.

## Human Review Rules

Human review is required if promotion changes:

- `package.json`
- `.github/workflows/`
- executable scripts
- CI required checks
- any test that touches auth, wallet, ledger, matching, settlement, admin, bot, deployment, Prisma, migrations, or production data

## Non-Goals

This plan does not:

- Change package scripts.
- Change CI.
- Add tests.
- Promote tests.
- Change route behavior.
- Change product, wallet, ledger, trading, admin, bot, deployment, Prisma, migration, or production behavior.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```

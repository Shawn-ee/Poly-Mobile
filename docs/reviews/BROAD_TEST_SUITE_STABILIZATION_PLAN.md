# Broad Test Suite Stabilization Plan

This TST-005 plan defines how to stabilize POLY test suites beyond the current required CI smoke command. It is docs-only and does not change tests, CI, package scripts, or product code.

## Current Baseline

Required dev/main CI currently runs:

```sh
npm ci
npm exec -- prisma generate --schema=prisma/schema.prisma
npm exec -- prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

`npm run test:ci` is the stable Jest smoke suite and should remain the required baseline until broader suites are isolated and repeatable.

## Known Broad-Suite Problems

`npm run test:jest` is not a green baseline yet because it mixes:

- CI smoke tests.
- DB-backed integration tests.
- Vitest-authored tests collected by Jest.
- Tests with environment and isolation assumptions that are not yet standardized.

Known blockers from `docs/TESTING.md`:

- Vitest imports inside Jest.
- Order rate-limit expectation drift.
- Admin market simulation auth expectation drift.
- Phase 8.5 simulation failure.
- DB test isolation requirements.
- `npm run test:phase3` uses Vitest but one test calls `jest.resetModules`.

## Target Test Lanes

### Lane 1: Required CI Smoke

Command:

```sh
npm run test:ci
```

Purpose:

- Fast required signal for every PR to `dev` and `main`.
- Covers selected health, config, wallet balance, order ticket logic, orderbook events/cancel behavior, SSE, sports event model, sensitive rate limit, admin withdrawals completion, and admin market invariants.

Merge policy:

- Required for normal code/test/config PRs.
- Required before any suite is promoted into CI.

### Lane 2: Broad Jest Candidate

Command:

```sh
npm run test:jest
```

Purpose:

- Catch wider regressions after runner-compatible tests are separated.

Required before CI promotion:

- No Vitest-authored files collected by Jest.
- DB-backed tests have deterministic setup/teardown.
- Auth and rate-limit expectations are stable.
- Known failing simulations are moved out of the broad Jest lane or fixed.

### Lane 3: Vitest Service Tests

Command:

```sh
npm run test:phase3
```

Purpose:

- Service-level ledger or financial invariant tests that are intentionally Vitest-based.

Required before CI promotion:

- Remove Jest-specific APIs from Vitest tests.
- Use Vitest-native module reset/mocking APIs.
- Keep financial tests human-reviewed when they touch ledger, balances, matching, settlement, deposits, or withdrawals.

### Lane 4: Playwright Public Smoke

Commands:

```sh
npm run e2e
npm run e2e:sports
```

Purpose:

- Validate public route rendering and core browsing flows before UI redesign.

Required before CI promotion:

- Stable test environment documented.
- No production credentials.
- No real wallet, deposit, withdrawal, or live bot dependencies.
- Public routes have predictable empty/loading/error expectations.

### Lane 5: Operational And Script Tests

Examples:

```sh
npm run smoke:phase9
npm run test:polygon-deposits
npm run test:reference-bot-initialization
```

Purpose:

- Validate operational, reconciliation, deposit, and bot flows in controlled test environments.

Required before CI promotion:

- Script safety classification exists.
- Commands are proven non-production and non-destructive.
- Required env vars are test-only.
- High-risk areas have SecurityAgent, LedgerWalletReviewerAgent, or BotAgent review.

## Stabilization Sequence

1. Keep `npm run test:ci` as the only required CI test command.
2. Inventory broad Jest failures with exact files, runner, setup requirements, and expected owner.
3. Move Vitest-authored tests out of Jest collection or rewrite them for Jest.
4. Fix `test:phase3` runner incompatibility by replacing Jest APIs with Vitest APIs in a later human-reviewed test PR.
5. Define deterministic DB setup and cleanup for integration tests.
6. Add public Playwright smoke baseline as an assisted, human-reviewed task.
7. Classify operational scripts before considering any script-based CI lane.
8. Promote one lane at a time into optional CI before making it required.

## Promotion Criteria

A suite can be promoted only when:

- It passes repeatedly on clean local and GitHub environments.
- It uses test-only credentials and databases.
- It has no production network, wallet, deposit, withdrawal, or live bot dependency.
- Failures are actionable and not caused by shared state leakage.
- Runtime is acceptable for PR feedback.
- Required owners are assigned for failures.
- Human review approves any high-risk financial, admin, bot, or deployment coverage.

## Future Issues To Create

| Task | Owner | Risk | Human review | Notes |
|---|---|---|---|---|
| Broad Jest failure inventory | TestingAgent | Medium | Yes | Read-only inventory first. |
| Vitest/Jest runner compatibility plan | TestingAgent | Medium | Yes | Do not rewrite tests until plan is approved. |
| Public Playwright smoke baseline | TestingAgent | Medium | Yes | Use no production credentials. |
| DB-backed test isolation plan | TestingAgent + BackendAgent | Medium | Yes | No production DB commands. |
| Reconciliation smoke design | TestingAgent + LedgerWalletReviewerAgent | High | Yes | Planning-only until approved. |
| Operational script safety classification | DocsAgent + SecurityAgent | High | Yes | Must precede script-based CI. |

## Non-Goals

This plan does not:

- Change CI.
- Change package scripts.
- Add or edit tests.
- Run broad unstable suites.
- Touch product code.
- Touch wallet, deposit, withdrawal, ledger, matching, settlement, admin auth, bot, Prisma, or deployment behavior.

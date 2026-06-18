# Bot Dry-Run Test Implementation Scope

Task id: TST-015
Assigned subagents: TestingAgent, BotAgent, SecurityAgent
Risk level: High by topic
Status: Docs-only implementation scope

## Purpose

This document narrows future bot dry-run test implementation work. It builds on `docs/reviews/BOT_DRY_RUN_SAFETY_TEST_PLAN.md` and `docs/reviews/BOT_CREDENTIAL_HANDLING_REVIEW.md` without adding tests, running bots, changing credentials, or altering bot runtime behavior.

This scope does not start live bots, use real credentials, change bot code, change risk limits, modify liquidity behavior, deploy, or change production settings.

## First Implementation Goal

The first bot test implementation should prove that dry-run mode can be tested without:

- Starting live trading.
- Reading real credentials.
- Calling production services.
- Placing orders.
- Moving funds.
- Changing market maker state.

The first implementation PR should be test-only, local-only, and mocked.

## Candidate First Test Areas

Preferred first candidates:

- Dry-run config parsing with fixture env values.
- Dry-run command construction without process execution.
- Risk-control decision functions if they are pure and do not import live clients.
- Bot status formatting with fixture data.

Avoid as first candidates:

- Any test that starts a bot loop.
- Any test that connects to live APIs.
- Any test that imports production wallet credentials.
- Any test that places/cancels orders.
- Any test that writes market maker state.
- Any test that requires real RPC, CLOB, exchange, or database credentials.

## Required Assertions

Future bot dry-run tests should assert:

- Dry-run defaults remain enabled.
- Live mode cannot be inferred from missing config.
- Required live credentials are not read in dry-run tests.
- Order-placement functions are mocked or not imported.
- External network clients are mocked.
- Logs/status outputs do not expose secret-like values.

## Forbidden Future Test Behavior

Future bot tests must not:

- Start live bot trading.
- Start long-running supervisor loops.
- Connect to live exchanges, CLOBs, RPC endpoints, or production APIs.
- Read real `.env` or secret files.
- Print tokens, private keys, mnemonics, signer material, or API keys.
- Place, cancel, or match orders.
- Create fills or trades.
- Update positions.
- Move funds.
- Change liquidity runtime behavior.
- Change market-making risk limits.
- Deploy services.

## Safe Mocking Boundary

Future tests should mock:

- Environment/config loading.
- Exchange/CLOB/RPC clients.
- Order placement/cancel clients.
- Wallet/signer clients.
- Database access.
- Time and scheduler loops.
- Logging sinks if needed for no-secret assertions.

Test fixtures should use obvious placeholder values such as `test-api-key` and `test-wallet-address`, never real credentials.

## Auto-Merge Policy

Future bot test implementation is not auto-mergeable by default in the current agent policy because bot behavior is high-risk by domain.

Docs-only scopes like this document may be auto-merged after internal self-review because they do not change behavior.

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

If a future bot package has its own test command, run it only when it is documented as local-only and does not require live credentials.

## Review Requirements

Future implementation PRs require:

- TestingAgent review for test isolation.
- BotAgent review for dry-run/live boundary correctness.
- SecurityAgent review for credential safety.
- LedgerWalletReviewerAgent review if any test touches orders, balances, positions, collateral, or funds.
- Human review before any bot live-mode, credential, exchange, RPC, or production operation test is merged.

## Acceptance Criteria For Future First Test PR

A future first implementation PR should:

- Change only test files.
- Use local fixtures and mocks.
- Prove dry-run safety without starting bots.
- Avoid real credentials and external services.
- Avoid product/runtime behavior changes.
- Document why the test is local-only.
- Leave live-mode findings for human-reviewed follow-up.

## Non-Goals

This scope does not:

- Add tests.
- Change bot code.
- Change market maker behavior.
- Change risk limits.
- Change wallet, ledger, balances, orders, fills, trades, matching, settlement, deposits, withdrawals, admin auth, deployment, Prisma, migrations, or production behavior.
- Authorize live bot trading.

## Validation For This Scope

This scope is docs-only. Validation for this PR should be:

```bash
git diff --check
```

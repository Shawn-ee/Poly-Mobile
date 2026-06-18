# Bot Dry-Run Safety Test Plan

Task id: TST-008
Assigned subagents: TestingAgent, BotAgent, SecurityAgent
Risk level: High by topic
Status: Docs-only test plan

## Purpose

This plan defines future tests proving bot disabled and dry-run modes cannot place real orders, use production credentials, or alter live liquidity. It does not add tests, run bots, create credentials, modify source code, or change runtime behavior.

## Safety Assertions

Future tests should prove:

- Missing bot mode defaults to disabled.
- Disabled mode creates no intended orders.
- Dry-run mode may compute intended actions but does not submit orders.
- Dry-run mode does not create fills, trades, ledger entries, or positions.
- Production credential variables are not required for CI.
- Stale data blocks intended actions.
- Kill switch blocks intended actions.
- Exposure caps block oversized intended actions.
- Market allowlist defaults empty.

## Test Environment Requirements

Future implementation must use:

- Local/test fixtures only.
- Mocked reference data.
- Mocked order submission boundary.
- No production credentials.
- No live external APIs.
- No real money movement.
- No production database.

## Suggested Test Groups

### Disabled Defaults

- Bot runtime is disabled when mode is missing.
- Bot runtime is disabled when config is invalid.
- No order-intent output is generated.

### Dry-Run Non-Mutation

- Dry-run computes a report.
- Dry-run does not call order placement.
- Dry-run does not change balances, ledger, orders, positions, or fills.

### Risk Blocks

- Stale reference data blocks action.
- Market not allowlisted blocks action.
- Kill switch blocks action.
- Cap exceeded blocks action.

### Reporting

- Dry-run report includes intended action, blocked reason, market id, mode, and timestamp.
- Dry-run report does not include secrets, private keys, or credentials.

## Future Validation

Future test implementation should run:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

Bot e2e commands should remain separate from required CI until explicitly stabilized.

## Auto-Merge Guidance

Future implementation is likely medium/high risk test-only work and should not be auto-merged by default. Leave it open for review unless the task is explicitly narrowed to low-risk tests with no runtime behavior changes.

## Forbidden Scope

Future test work must not:

- Enable live bot mode.
- Generate production bot credentials.
- Fund bot accounts.
- Place real orders.
- Change liquidity runtime behavior.
- Change matching, ledger, balances, positions, deposits, withdrawals, Prisma, migrations, deployment, or secrets.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```

# Public API Test Safety Guide

Task id: DOC-005
Assigned subagents: TestingAgent, SecurityAgent, DocsAgent
Risk level: Low
Status: Docs-only testing safety guide

## Purpose

This guide defines how future public API tests should be written so they improve confidence without touching production data, secrets, custody, trading, admin auth, live bots, deployment, or money movement.

It supports:

- `docs/reviews/PUBLIC_API_NO_LEAK_TEST_PLAN.md`
- `docs/reviews/PUBLIC_READ_API_CONTRACT_DRAFT.md`
- `docs/reviews/BETA_READINESS_EVIDENCE_TRACKER.md`
- `docs/TESTING.md`

## Eligible Public API Test Scope

Low-risk public API tests may cover read-only routes such as:

- `/api/health`
- `/api/categories`
- `/api/tags`
- `/api/events`
- `/api/events/[slug]`
- `/api/sports`
- `/api/sports/soccer/events`
- `/api/sports/soccer/world-cup/events`
- `/api/markets`
- `/api/markets/[id]`
- `/api/markets/[id]/quote`
- `/api/markets/[id]/trades`
- `/api/orderbook/[marketId]/book`
- `/api/orderbook/[marketId]/trades`

If a route requires a user session, admin session, wallet state, trading mutation, bot control, or deployment context, it is not a low-risk public API test.

## Required Safety Pattern

Future low-risk tests should:

- Import route handlers directly.
- Mock Prisma and service dependencies.
- Use local fixture objects only.
- Assert stable response shape for public display fields.
- Assert forbidden sensitive fields are not present.
- Avoid snapshot tests that normalize unexpected sensitive fields.
- Keep each PR focused on one route group.
- Run targeted Jest plus the standard validation gate for test-only PRs.

## Forbidden Test Dependencies

Low-risk public API tests must not require:

- Real production databases.
- Real staging databases unless a human explicitly approves a staging test plan.
- Real environment secrets.
- GitHub tokens.
- Chain RPC credentials.
- Wallet private keys.
- Mnemonics or signer material.
- Payment/custody provider credentials.
- Live bot credentials.
- Production deployment configuration.
- External APIs unless explicitly mocked.

## Forbidden Test Behavior

Low-risk public API tests must not:

- Mutate production or staging data.
- Place orders.
- Cancel orders.
- Create fills or trades.
- Update positions.
- Change user balances.
- Create ledger entries or ledger transactions.
- Create deposits or withdrawals.
- Approve, reject, or complete withdrawals.
- Generate or reveal wallet private keys.
- Start live bots.
- Deploy services.
- Modify admin auth behavior.

## Mocking Rules

Use explicit mocks for:

- `@/lib/db`
- Pricing/read-model helper services when route handlers import them.
- Reference market services.
- External fetch clients.

Mocks should return display-safe fixture fields. Do not seed fixtures with fake secrets unless the test is explicitly verifying sanitizer behavior in an approved security test, because current public read routes may legitimately echo some metadata fields.

## Forbidden Public Response Fields

Public no-leak tests should check for sensitive keys such as:

- `privateKey`
- `secret`
- `token`
- `credential`
- `signer`
- `mnemonic`
- `seedPhrase`
- `adminNotes`
- `internalNotes`
- `botAccountId`
- `botCredentialId`
- `runId`
- `jobId`
- `riskLimit`
- `killSwitch`
- `ledgerEntryId`
- `ledgerTransactionId`
- `withdrawalApproval`
- `depositPrivateKey`
- `walletPrivateKey`

Route-specific allowlists are preferred for mature contracts, but broad forbidden-key checks are acceptable for early public-read no-leak coverage.

## Validation Commands

For a low-risk public API test-only PR, run:

```bash
git diff --check
npx jest --runInBand --detectOpenHandles <new-test-file>
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

If a new test is not added to `npm run test:ci`, the PR body must say so explicitly.

## Auto-Merge Eligibility

A public API test PR may be auto-merged only when:

- Changed files are limited to `src/__tests__/`, `tests/`, or safe test docs.
- The test uses mocks or local-only fixtures.
- The test covers public/read-only/no-leak behavior.
- No product/runtime implementation changed.
- No real DB, secrets, external services, production data, or money movement are required.
- Full validation passes.
- ReviewerAgent and SecurityAgent self-review pass.
- GitHub reports no merge conflicts.

## Human Review Required

Human review is required if a test PR touches or exercises:

- Wallet, deposit, withdrawal, ledger, balances, matching, settlement, orders, fills, trades, or positions.
- Admin auth behavior.
- Bot live trading or liquidity runtime behavior.
- Prisma schema or migrations.
- CI workflows, package scripts, executable scripts, deployment config, or production settings.
- Real credentials, real external accounts, or production/staging data.

## Non-Goals

This guide does not:

- Add tests.
- Change CI.
- Change package scripts.
- Change route behavior.
- Change wallet, deposit, withdrawal, ledger, matching, settlement, admin auth, bot, deployment, Prisma, or production behavior.

## Validation For This Guide

This guide is docs-only. Validation for this PR should be:

```bash
git diff --check
```

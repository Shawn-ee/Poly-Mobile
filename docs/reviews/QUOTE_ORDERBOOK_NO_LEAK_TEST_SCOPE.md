# Quote And Orderbook No-Leak Test Scope

Task id: TST-013
Assigned subagents: TestingAgent, SecurityAgent, LedgerWalletReviewerAgent
Risk level: Medium
Status: Docs-only test implementation scope

## Purpose

This document scopes future no-leak tests for public quote, orderbook, and trade-tape read routes. These routes are public-read surfaces, but they are trading-adjacent, so implementation tests should be handled more carefully than taxonomy, event, sports, or market-list tests.

This scope does not add tests, change code, alter matching, place orders, create fills, update positions, change balances, or modify wallet, ledger, settlement, admin, bot, Prisma, migration, workflow, script, deployment, or production behavior.

## Candidate Routes

Future tests may cover:

- `/api/markets/[id]/quote`
- `/api/markets/[id]/trades`
- `/api/orderbook/[marketId]/book`
- `/api/orderbook/[marketId]/trades`

Do not include:

- Order placement routes.
- Order cancellation routes.
- Fill creation routes.
- Position routes.
- Wallet or balance routes.
- Settlement or resolution mutation routes.
- Admin-only trading controls.

## Safe Test Intent

Future tests should verify only that public read responses:

- Return display-safe quote fields.
- Return display-safe orderbook levels.
- Return display-safe trade-tape fields.
- Do not expose user-specific balances, positions, order ownership, ledger ids, bot controls, credentials, or admin-only notes.
- Handle empty quote/orderbook/trade-tape states without leaking internals.

## Forbidden Behavior In Future Tests

Tests for these routes must not:

- Place orders.
- Cancel orders.
- Match orders.
- Create fills.
- Create trades.
- Update positions.
- Lock or unlock balances.
- Create ledger entries.
- Create ledger transactions.
- Trigger settlement or resolution.
- Call a real database.
- Call live pricing, chain, wallet, or bot services.
- Require secrets, credentials, production data, or external APIs.

## Required Mocking Boundary

Future tests should mock:

- Prisma or repository access.
- Orderbook read services.
- Quote calculation helpers.
- Trade-tape read helpers.
- Any reference-market or liquidity summary helper.

Mocks should return stable local fixtures only. The fixtures should include:

- Empty quote state.
- Empty orderbook state.
- Normal two-sided book state.
- Small public trade-tape state.
- Stale/unavailable quote state if the route supports it.

## Forbidden Public Response Fields

Future tests should reject keys such as:

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
- `orderOwnerId`
- `userId`
- `positionId`
- `balanceId`
- `walletPrivateKey`
- `depositPrivateKey`

If a public route currently returns a user-specific field, the test PR should stop and document the finding instead of changing route behavior in the same PR.

## Validation For Future Test PRs

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

If the tests are trading-adjacent, do not auto-merge unless the active cycle explicitly allows low-risk test-only trading-read coverage and SecurityAgent plus LedgerWalletReviewerAgent self-review both pass.

## Review Requirements

Future implementation PRs require:

- TestingAgent review for route-test correctness.
- SecurityAgent review for no-leak coverage and secret safety.
- LedgerWalletReviewerAgent review because quote, orderbook, and trade-tape reads are trading-adjacent.

Human review is required if tests expose or assert behavior around:

- User-specific orders.
- Positions.
- Balances.
- Ledger entries or ledger transactions.
- Matching behavior.
- Settlement behavior.
- Market-making or bot liquidity controls.

## Acceptance Criteria For Future Tests

A future test PR should:

- Change only test files.
- Use mocks or local fixtures.
- Avoid real DB, external services, and secrets.
- Prove at least one route group returns public-safe fields.
- Document any route that is too coupled to trading internals for low-risk auto-merge.
- Leave behavior changes for a separate human-reviewed PR.

## Non-Goals

This scope does not:

- Add tests.
- Change API routes.
- Change response shapes.
- Change trading logic.
- Change matching, orders, fills, trades, positions, balances, ledger, settlement, wallet, deposits, withdrawals, admin auth, bots, deployment, Prisma, migrations, or production behavior.

## Validation For This Scope

This scope is docs-only. Validation for this PR should be:

```bash
git diff --check
```

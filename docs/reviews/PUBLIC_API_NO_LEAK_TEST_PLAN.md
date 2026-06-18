# Public API No-Leak Test Plan

Task id: TST-007
Assigned subagents: TestingAgent, SecurityAgent, BackendAgent
Risk level: Medium
Status: Test planning only

## Purpose

Public market, event, sports, quote, orderbook, and trade-tape APIs should not expose admin-only, bot-control, credential, wallet, ledger, or user-specific financial details. This plan defines future no-leak tests for public read APIs without adding tests or changing route behavior now.

This document does not modify product code, API routes, tests, Prisma, wallet, ledger, matching, settlement, admin auth, bot behavior, deployment, or production settings.

## Source Documents

This plan is based on:

- `docs/reviews/API_ROUTE_OWNERSHIP_INVENTORY.md`
- `docs/reviews/MARKET_READ_API_CLEANUP_PLAN.md`
- `docs/reviews/PUBLIC_READ_API_CONTRACT_DRAFT.md`
- `docs/reviews/REFERENCE_LIQUIDITY_UX_BOUNDARY_PLAN.md`
- `docs/HIGH_RISK_AREAS.md`
- `docs/LEDGER_AND_WALLET_RULES.md`

## Public Route Candidates

Future no-leak tests should prioritize:

- `/api/health`
- `/api/categories`
- `/api/tags`
- `/api/markets`
- `/api/markets/[id]`
- `/api/markets/[id]/chart`
- `/api/markets/[id]/quote`
- `/api/markets/[id]/trades`
- `/api/markets/[id]/reference`
- `/api/events`
- `/api/events/[slug]`
- `/api/events/[slug]/markets`
- `/api/events/[slug]/grouped-markets`
- `/api/sports`
- `/api/sports/soccer/events`
- `/api/sports/soccer/world-cup/events`
- `/api/orderbook/[marketId]/book`
- `/api/orderbook/[marketId]/trades`

Routes that require account/session context, trading mutation, admin auth, wallet/funding, or bot mutation should be tested separately and are not part of this public no-leak plan.

## Forbidden Public Response Fields

Future tests should fail if public read responses expose obvious internal fields such as:

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
- `runId` for internal agent or bot runs
- `jobId` for internal snapshot/import jobs
- `riskLimit`
- `killSwitch`
- `ledgerEntryId`
- `ledgerTransactionId`
- `withdrawalApproval`
- `depositPrivateKey`
- `walletPrivateKey`

The final implementation should use exact assertions appropriate to actual response shapes rather than only broad string matching.

## Forbidden Public Concepts

Future tests should also guard against public leakage of concepts such as:

- Admin-only market operations.
- Bot readiness internals.
- Reference market import status.
- Liquidity seeding controls.
- Credential generation status.
- Wallet custody internals.
- Ledger transaction internals.
- User-specific order ownership.
- User-specific balance, deposit, withdrawal, or position data.
- Production deployment or service configuration details.

## Suggested Test Structure

Future test implementation should be separate from this planning PR and may use:

- Focused Jest route tests if the existing test harness supports route handlers directly.
- Fixture-backed tests for representative public market/event/sports data.
- Snapshot-style field allowlists for selected public routes.
- Negative assertions for forbidden fields and concepts.

Recommended grouping:

1. Taxonomy no-leak tests.
2. Market discovery no-leak tests.
3. Market detail no-leak tests.
4. Event/sports no-leak tests.
5. Quote/orderbook/trade-tape no-leak tests.
6. Reference route boundary tests.

## Allowlist Strategy

The safest future implementation is an allowlist per route group:

- Market summary fields.
- Market detail fields.
- Event summary fields.
- Event detail fields.
- Quote fields.
- Orderbook read fields.
- Trade tape fields.

Allowlist tests should permit documented display fields and reject unexpected sensitive fields.

## Dataset Requirements

Future tests should use seeded or mocked data that includes:

- A normal public market.
- A sports event with grouped markets.
- A market with no trades.
- A market with empty orderbook.
- A stale or unavailable quote state if supported.
- A reference-associated market, without exposing admin/reference internals publicly.

The tests should not require production credentials, live external APIs, real deposits, real withdrawals, or live bot trading.

## Validation For Future Test PR

If future tests are implemented, run:

```bash
git diff --check
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
```

If Playwright tests are involved, keep them separate from required CI until they are stable.

## Human Review Rules

Human review is required if a future PR:

- Changes route behavior.
- Changes auth behavior.
- Touches wallet, deposit, withdrawal, ledger, matching, settlement, orders, fills, trades, positions, admin auth, bot live trading, Prisma, migrations, or production config.
- Adds tests that require real credentials or external services.

Docs-only no-leak planning can be handled by TestingAgent, SecurityAgent, and BackendAgent self-review.

## Acceptance Criteria For Future Test Implementation

A future implementation PR should:

- Add focused tests without broad product refactors.
- Use stable fixtures or safe mocks.
- Prove selected public routes do not expose forbidden fields.
- Preserve existing CI behavior.
- Avoid touching financial, wallet, admin mutation, bot live trading, deployment, Prisma, and migration code.
- Document any pre-existing leak findings rather than silently changing behavior in the same PR.

## Non-Goals

This plan does not:

- Add tests.
- Change public response shapes.
- Change API implementation.
- Change auth, wallet, ledger, matching, settlement, admin, bot, deployment, Prisma, or production behavior.
- Run live external services.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```

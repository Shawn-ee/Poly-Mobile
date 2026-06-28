# Market Detail Public Boundary Review

Task id: DOC-009
Assigned subagents: TestingAgent, SecurityAgent, BackendAgent
Risk level: Medium
Status: Docs-only boundary review

## Purpose

This review explains why `/api/markets/[id]` should not be treated as a simple low-risk public no-leak test target yet.

The route is read-oriented, but it calls auth and market visibility guards and returns fields that need an explicit public contract decision.

This document does not change route behavior, auth behavior, tests, API contracts, product code, Prisma, wallet, ledger, matching, settlement, bots, deployment, or production settings.

## Current Route Observations

Current route file:

- `src/app/api/markets/[id]/route.ts`

Observed behavior from source inspection:

- Calls `getUserId()`.
- Loads a market by id with `marketReadInclude`.
- Returns 404 when missing.
- Calls `assertMarketVisibleToUser({ market, userId })`.
- Serializes the market through `serializeMarketReadModel`.
- Adds `ownerId`, `isCanceled`, `betCloseTime`, and `isListed` to the returned `market` object.

## Boundary Concern

The route may be correct for current product behavior, but it is not yet clearly one of these:

- Anonymous public market detail read.
- Auth-aware public/private market detail read.
- Internal mixed market detail read.
- MVP public market detail contract.

Until that boundary is explicit, low-risk no-leak tests should not silently encode the current response as the final public contract.

## Fields Needing Contract Decision

Fields requiring review before public contract tests:

- `ownerId`
- `isCanceled`
- `betCloseTime`
- `isListed`
- `externalMarketId`
- `conditionId`
- `referenceSource`
- `externalSlug`
- `importStatus`
- `referenceOnly`
- `tradable`
- `mmEnabled`
- `referenceSummary`
- outcome `referenceTokenId`
- outcome `referenceOutcomeLabel`

Some fields may be harmless display data, but others can expose internal ownership, reference-market, market-making, or operational concepts that should be explicitly approved for public display.

## Safe Future Test Scope

A future first test should be planning or contract-focused unless the public contract is clarified.

Safe future tests may verify:

- Missing market returns 404.
- Private or hidden market is rejected by mocked guard.
- A display-safe public market fixture returns only approved public fields.
- Forbidden sensitive keys are absent.

But those tests should not assert that owner, listing, reference, or market-making fields are desirable public contract fields without approval.

## Required Mocking Boundary For Future Tests

Future tests should mock:

- `@/lib/auth`
- `@/lib/marketAccess`
- `@/lib/marketGuards`
- `@/lib/db`
- pricing/read-model helper services

Tests must not require:

- Real sessions.
- Real users.
- Real database.
- Real wallet, ledger, bot, reference-market, or external service data.

## Recommended Contract Decision

Before broad market detail test expansion, decide whether the MVP public market detail response should:

- Exclude owner/listing/admin-like fields.
- Keep reference fields but rename them as display-only metadata.
- Hide market-making and import status fields from normal users.
- Separate public detail from admin/internal detail.
- Document auth-aware private market behavior separately.

## Review Requirements

Future implementation tests require:

- TestingAgent review for mock isolation.
- SecurityAgent review for auth/no-leak behavior.
- BackendAgent review for route contract accuracy.
- LedgerWalletReviewerAgent review if tests touch positions, balances, orders, fills, trades, matching, settlement, or collateral.
- BotAgent review if reference/liquidity/market-making fields are asserted.

## Non-Goals

This review does not:

- Change `/api/markets/[id]`.
- Add tests.
- Remove fields.
- Change auth or visibility behavior.
- Change market read model serialization.
- Change wallet, ledger, trading, admin, bot, deployment, Prisma, migration, or production behavior.

## Validation For This Review

This review is docs-only. Validation for this PR should be:

```bash
git diff --check
```

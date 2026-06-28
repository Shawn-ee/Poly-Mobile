# Market Detail Current-Gap Test Review Packet

Task id: DOC-040

Phase: Phase B - Public API safety and tests

Assigned subagents: PlannerAgent, TestingAgent, BackendAgent, SecurityAgent

Risk level: Medium by API contract topic, docs-only in this task

## Purpose

This packet defines the safe scope for a future mocked current-gap test for `/api/markets/[id]`.

It does not add tests, change route behavior, change serializers, change auth or visibility behavior, change Prisma, change wallet/ledger/trading/admin/bot/deployment behavior, or approve market detail cleanup.

## Current Route Observation

Read-only inspection found:

- `src/app/api/markets/[id]/route.ts`:
  - Reads `userId` through `getUserId`.
  - Reads a market through Prisma with `marketReadInclude`.
  - Returns `{ error: "Market not found." }` with status `404` when missing.
  - Calls `assertMarketVisibleToUser`.
  - Serializes with `serializeMarketReadModel`.
  - Adds `ownerId`, `isCanceled`, `betCloseTime`, and `isListed` into the returned `market` object.
- `src/server/services/marketReadModel.ts`:
  - Adds reference/import/market-making fields such as `externalMarketId`, `conditionId`, `referenceSource`, `externalSlug`, `importStatus`, `referenceOnly`, `tradable`, `mmEnabled`, and `referenceSummary`.
  - Includes outcome `metadata`, `referenceTokenId`, and `referenceOutcomeLabel`.
  - Includes event fields such as source and external identifiers.

These observations are not approvals. They identify the current gap between the route’s present response shape and the target display-safe public contract.

## Current Gap Summary

The target contract documents prefer a normal public market detail response focused on display-safe market, event, category, tag, outcome, and price fields.

The current route may also return:

- owner/listing/cancellation/bet-close fields
- reference/import/condition identifiers
- market-making/tradability flags
- reference summary data
- outcome metadata and reference token fields
- event source/external identifiers

Some of these fields may be harmless in context, but they are not yet approved as normal MVP public contract fields.

## Safe Future Test Scope

A future current-gap test may be opened if it:

- Changes only `src/__tests__/public.market-detail.no-leak.test.ts` or a similarly named test file.
- Imports the route handler directly.
- Mocks `@/lib/auth`.
- Mocks `@/lib/db`.
- Mocks `@/lib/marketAccess`.
- Mocks `@/server/services/marketReadModel` or fixture output as needed.
- Uses local fixtures only.
- Does not require a real database, secrets, chain RPC, external services, production data, credentials, wallet keys, or login/admin credentials.
- Does not mutate data.
- Does not change route code or serializers.
- Documents current extra-field exposure as a gap rather than blessing it as desired public behavior.

## Recommended Assertions

The first current-gap test should focus on evidence, not cleanup:

- Missing market returns `404` with an error object.
- Visibility guard errors are passed through using the current guard response shape.
- A public listed fixture returns a `market` object.
- Current extra fields can be detected in the fixture output and described as current-gap fields.
- Target-contract allowlist remains documented in review docs rather than forced into route code.

Avoid assertions that make internal fields look desirable or permanent. If a test asserts that a field is currently present, name it as a current gap.

## Forbidden Scope

Do not include in the current-gap test PR:

- route implementation changes
- serializer changes
- auth or visibility behavior changes
- Prisma schema or migration changes
- package script or workflow changes
- wallet, deposit, withdrawal, ledger, matching, settlement, order, fill, trade, position, admin auth, bot, deployment, production config, or secret changes
- real DB or production fixture usage
- reference/liquidity split implementation
- public quote/orderbook/trade-tape tests

## Auto-Merge Decision For Future Test PR

Do not auto-merge the future market detail current-gap test by default.

Reason:

- The route is medium-risk by public contract topic.
- The test may document fields that should not become permanent public API contract.
- The result should be reviewed by BackendAgent, SecurityAgent, and TestingAgent before any cleanup or target-contract implementation.

The future PR may still be opened autonomously if it is mocked/local and validation passes, but it should remain open for review unless a later explicit policy allows merge.

## Required Validation For Future Test PR

```bash
git diff --check
npx jest --runInBand --detectOpenHandles src/__tests__/public.market-detail.no-leak.test.ts
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

## Review Requirements

Future market detail current-gap test PR requires:

- TestingAgent review for mocked/local isolation.
- SecurityAgent review for sensitive field framing.
- BackendAgent review for route contract accuracy.
- BotAgent review if reference/liquidity/market-making fields become central to the assertion.
- LedgerWalletReviewerAgent review only if the test starts involving balances, positions, orders, fills, trades, settlement, or collateral.

## Decision

Market detail current-gap testing is useful, but it is not a low-risk auto-merge lane. Add the test only as evidence, keep implementation separate, and leave the test PR open for review unless a later human-approved policy changes the merge boundary.

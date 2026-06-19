# Market Detail Cleanup Implementation Plan

Task id: DOC-019
Assigned subagents: BackendAgent, TestingAgent, SecurityAgent
Risk level: Medium
Status: Docs-only implementation plan

## Purpose

This plan scopes a future implementation PR to align `/api/markets/[id]` with `docs/reviews/MARKET_DETAIL_PUBLIC_CONTRACT_DECISION.md`.

It does not change code, tests, route behavior, auth behavior, wallet, ledger, matching, settlement, bots, Prisma, deployment, or production settings.

## Target Outcome

Future implementation should make market detail responses display-safe for normal users while preserving auth-aware visibility checks.

The future route should:

- Continue returning 404 for missing markets.
- Continue enforcing market visibility.
- Return a documented public detail contract.
- Avoid exposing owner/listing/reference/market-making internals in the normal public contract.
- Keep admin/internal diagnostics separate.

## Likely Files For Future PR

Future implementation may touch:

- `src/app/api/markets/[id]/route.ts`
- `src/server/services/marketReadModel.ts`
- `src/__tests__/public.market-detail.no-leak.test.ts`
- relevant docs under `docs/reviews/`

Do not touch in that PR unless explicitly approved:

- wallet/deposit/withdrawal routes
- ledger or balance services
- matching/order/fill/trade/position services
- admin auth
- bot runtime or liquidity runtime
- Prisma schema or migrations
- package scripts or workflows

## Suggested Implementation Sequence

1. Add mocked tests documenting current extra-field gaps.
2. Decide whether cleanup should happen in route wrapper or read-model serializer.
3. Add a display-safe mapping function for public detail output if needed.
4. Keep internal/admin detail fields out of the public response.
5. Run full validation.
6. Leave any behavior-changing PR open for human review unless explicitly allowed.

## Fields To Remove Or Relocate From Public Contract

Future cleanup should evaluate:

- `ownerId`
- `isListed`
- `isCanceled`
- `betCloseTime`
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
- raw `metadata`

If any of these are required by current UI, document the UI dependency before removing them.

## Test Requirements

Future tests should cover:

- public listed market success
- missing market 404
- visibility guard rejection
- no sensitive keys
- no public owner/listing/reference/market-making internals unless explicitly approved

Tests must mock:

- auth/session
- market visibility guard
- Prisma reads
- pricing/read-model helpers

## Validation For Future Implementation

Future implementation PRs should run:

```bash
git diff --check
npx jest --runInBand --detectOpenHandles <new-or-updated-test-file>
npx prisma generate --schema=prisma/schema.prisma
npx prisma validate --schema=prisma/schema.prisma
npx tsc --noEmit --pretty false --incremental false
npm run test:ci
git diff --cached --check
```

## Review Requirements

Future implementation requires:

- BackendAgent review for response shape.
- SecurityAgent review for field exposure.
- TestingAgent review for mocked test isolation.
- BotAgent review if reference/liquidity fields remain public.
- LedgerWalletReviewerAgent review if positions, balances, orders, fills, trades, matching, settlement, or collateral become involved.

## Auto-Merge Policy

This docs-only plan may be auto-merged.

Future implementation must not be auto-merged by default because it changes API response behavior.

## Non-Goals

This plan does not:

- Change API code.
- Add tests.
- Remove fields.
- Change auth or visibility behavior.
- Change wallet, ledger, matching, settlement, admin auth, bot, deployment, Prisma, migration, or production behavior.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```

# Reference Liquidity Split Implementation Plan

Task id: DOC-020
Assigned subagents: SecurityAgent, BotAgent, BackendAgent, TestingAgent, LedgerWalletReviewerAgent
Risk level: High by topic
Status: Docs-only implementation plan

## Purpose

This plan scopes future implementation for the split defined in `docs/reviews/REFERENCE_LIQUIDITY_PUBLIC_ADMIN_SPLIT_DECISION.md`.

It does not change API routes, bot behavior, liquidity behavior, auth, tests, Prisma, wallet, ledger, matching, settlement, deployment, secrets, or production settings.

## Target Outcome

Future implementation should separate:

- Public liquidity summary for normal users.
- Admin/operator reference diagnostics for internal operations.

Normal users should receive display-safe liquidity status without bot accounts, bot orders, bot balances, bot positions, live-mode flags, internal formulas, or operational diagnostics.

## Likely Future Route Shape

Possible future shape:

- Public summary route: `/api/markets/[id]/liquidity-summary` or revised public-safe `/api/markets/[id]/reference`
- Admin diagnostics route: `/api/admin/markets/[id]/reference-diagnostics` or admin reference-market route

Route names are not decided by this plan. A future implementation PR must document the chosen route shape.

## Likely Files For Future PR

Future implementation may touch:

- `src/app/api/markets/[id]/reference/route.ts`
- a new public summary route under `src/app/api/markets/[id]/`
- admin reference diagnostics routes under `src/app/api/admin/`
- read-model helper services under `src/server/services/`
- focused mocked tests under `src/__tests__/`
- docs under `docs/reviews/`

Do not touch without explicit approval:

- bot live runtime behavior
- liquidity seeding behavior
- order placement or cancellation
- matching, fills, trades, positions, balances, ledger, settlement
- wallet/deposit/withdrawal
- Prisma schema or migrations
- package scripts or workflows
- production config or secrets

## Suggested Implementation Phases

### Phase 1: Public Summary Contract

- Define exact display-safe fields.
- Add mocked tests first.
- Do not change admin diagnostics.

### Phase 2: Admin Diagnostics Contract

- Define protected diagnostic fields.
- Require admin auth review.
- Add no-secret tests.

### Phase 3: Route Split Or Wrapper

- Implement public summary mapping.
- Keep diagnostics protected.
- Preserve current behavior only where explicitly approved.

### Phase 4: UI Consumption

- Update UI only after public summary route is stable.
- Show plain-language liquidity copy.
- Do not show bot internals to normal users.

## Public Summary Fields

Candidate public fields:

- `marketId`
- `liquidityStatus`
- `priceStatus`
- `isStale`
- `unavailableReason`
- `lastUpdatedAt`
- display-safe outcome quote summaries
- plain-language copy key or label

## Admin Diagnostics Fields

Candidate admin-only fields:

- external market ids
- condition ids
- reference snapshot status
- quote plan details
- bot initialization state
- dry-run/live state
- active bot order ids
- bot capital summaries
- risk cap and stale-data checks
- operator formulas or troubleshooting details

## Test Requirements

Future tests should include:

- public summary no-leak tests
- admin diagnostics auth/no-secret tests
- stale/unavailable public summary tests
- dry-run/live diagnostic tests with mocked env/config only

Future tests must not:

- start bots
- connect to live services
- place/cancel orders
- read real credentials
- move funds
- mutate production/staging data

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

- SecurityAgent review for public/internal exposure.
- BotAgent review for bot/reference diagnostics.
- LedgerWalletReviewerAgent review for any balance, position, order, notional, loss, matching, settlement, or funds-derived field.
- BackendAgent review for route contracts.
- TestingAgent review for mocked isolation.
- Human review before merging implementation.

## Auto-Merge Policy

This docs-only plan may be auto-merged.

Future implementation must not be auto-merged by default because it changes public/admin route behavior and touches bot/reference/liquidity boundaries.

## Non-Goals

This plan does not:

- Change API code.
- Add tests.
- Start bots.
- Change liquidity behavior.
- Change wallet, ledger, matching, settlement, orders, fills, trades, positions, deposits, withdrawals, admin auth, deployment, Prisma, migrations, or production behavior.

## Validation For This Plan

This plan is docs-only. Validation for this PR should be:

```bash
git diff --check
```

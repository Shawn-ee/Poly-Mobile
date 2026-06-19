# Reference Route Public Boundary Review

Task id: DOC-010
Assigned subagents: SecurityAgent, BotAgent, LedgerWalletReviewerAgent, TestingAgent
Risk level: High by topic
Status: Docs-only boundary review

## Purpose

This review explains why `/api/markets/[id]/reference` should not be treated as a low-risk public no-leak test target or a normal user-facing contract without a separate boundary decision.

The route is read-only from the HTTP perspective, but it exposes bot, reference, order, balance, and position-derived operational details.

This document does not change route behavior, bot behavior, orderbook behavior, wallet or ledger behavior, tests, Prisma, deployment, secrets, or production settings.

## Current Route Observations

Current route file:

- `src/app/api/markets/[id]/reference/route.ts`

Observed behavior from source inspection:

- Calls `getUserId()`.
- Loads a market with reference metadata and owner/reference identifiers.
- Calls `assertMarketVisibleToUser`.
- Loads latest reference quote plans.
- Parses bot initialization metadata.
- If a bot user id exists, loads bot open orders.
- Loads bot user balance.
- Loads bot positions.
- Returns dry-run and live-orders flags derived from environment variables.
- Returns active bot bid/ask prices and active order ids by outcome.
- Returns bot capital summary including open-order notional, daily loss, available cash, and locked cash.

## Boundary Concern

This route crosses several domains:

- Public market read model.
- Reference market/liquidity diagnostics.
- Bot initialization state.
- Bot orders.
- Bot balance.
- Bot positions.
- Environment-driven live/dry-run flags.

Those details may be useful for admin or operator diagnostics, but they are not obviously appropriate for normal public users. The route should be classified before future tests encode its current shape as public behavior.

## Sensitive Or Internal Concepts Present

Fields or concepts needing explicit review:

- `ownerId`
- `externalMarketId`
- `conditionId`
- `referenceMetadata`
- `botInitialization`
- `botUserId`
- bot open orders
- `activeBidOrderId`
- `activeAskOrderId`
- `availableCashUSDC`
- `lockedCashUSDC`
- `openOrderNotionalCents`
- `dailyLossCents`
- `dryRun`
- `liveOrdersEnabled`
- formula text describing bot pricing logic

Some of these fields are operationally valuable, but normal users should not need bot internals to understand market liquidity.

## Recommended Boundary Decision

Before adding implementation tests or public contract assertions, decide whether `/api/markets/[id]/reference` should become:

1. Admin-only diagnostics route.
2. Internal operator route behind admin auth.
3. Public-safe liquidity summary route with bot internals removed.
4. Split routes: public liquidity summary plus admin reference diagnostics.

The safest MVP direction is split-route behavior:

- Public users see simple liquidity/reference availability summaries.
- Admin operators see bot/reference diagnostic details in admin-only routes.

## Safe Future Test Scope

Future docs or tests may safely verify:

- The route is classified before public contract promotion.
- Public UI does not rely on bot internals.
- Admin/operator docs define who may see reference diagnostics.

Future implementation tests should not be auto-merged unless explicitly scoped and reviewed.

If implementation tests are added later, they should:

- Mock auth.
- Mock market visibility.
- Mock Prisma.
- Mock reference quote plans.
- Mock bot initialization parsing.
- Use fake local bot/user ids.
- Avoid real env values, real credentials, real balances, real positions, real orders, and external services.

## Forbidden Future Test Behavior

Future tests must not:

- Read or print production environment variables.
- Use real bot credentials.
- Start live bots.
- Place or cancel orders.
- Create fills or trades.
- Update positions.
- Change balances.
- Create ledger entries.
- Trigger settlement.
- Call live reference APIs.
- Call chain RPC.
- Mutate production or staging data.

## Review Requirements

Future implementation PRs require:

- SecurityAgent review for route exposure and secret/env safety.
- BotAgent review for reference and bot diagnostic fields.
- LedgerWalletReviewerAgent review because the route reads bot balances, positions, and order-derived notional/loss.
- TestingAgent review for mock isolation.
- Human review before any production/public exposure decision.

## Non-Goals

This review does not:

- Change `/api/markets/[id]/reference`.
- Add tests.
- Move fields.
- Change auth.
- Change bot/reference/liquidity behavior.
- Change wallet, ledger, orders, fills, trades, positions, matching, settlement, admin, deployment, Prisma, migrations, or production behavior.

## Validation For This Review

This review is docs-only. Validation for this PR should be:

```bash
git diff --check
```

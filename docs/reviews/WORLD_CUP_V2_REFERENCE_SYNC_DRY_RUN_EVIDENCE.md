# World Cup V2 Reference Sync Dry-Run Evidence

Date: 2026-06-26

Goal: `agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md`

## Lead Agent Decision

The next active-goal task after bot inventory evidence was `reference-sync-integrated-dry-run-evidence`.

This cycle verified the current app/bot reference-sync boundary without enabling live trading, public trading, or live bots.

## Current Architecture

App repo supports reference metadata and quote snapshots through:

- `Market.referenceSource`
- `Market.externalMarketId`
- `Market.externalSlug`
- `Market.conditionId`
- `Market.referenceMetadata`
- `Outcome.referenceTokenId`
- `Outcome.referenceOutcomeLabel`
- `ReferenceQuoteSnapshot`

Relevant app routes:

- `GET /api/markets/[id]/reference`
- `GET /api/admin/reference-markets`
- admin reference import/review/snapshot routes documented in route inventories

Bot repo supports reference workflows through:

- `npm run test:reference-market-import`
- `npm run test:reference-liquidity`
- `npm run test:reference-arbitrage-rebalancer`
- `npm run reference:cache-dry-run`
- `npm run liquidity:reference-dry-run`

## What Was Actually Run

Bot repo:

```text
npm run bots:safety
npm run test:reference-market-import
npm run test:reference-liquidity
npm run test:reference-arbitrage-rebalancer
```

Result:

- bot safety passed;
- reference market import tests passed;
- reference liquidity tests passed;
- reference arbitrage rebalancer checks passed.

App repo:

```text
npx jest --runInBand src/__tests__/public.market-list.no-leak.test.ts src/__tests__/public.event-markets.no-leak.test.ts src/__tests__/public.events.no-leak.test.ts src/__tests__/public.market-detail.current-gap.test.ts src/__tests__/sports.event-market-model.test.ts
```

Result:

- 5 suites passed;
- 18 tests passed.

## Narrow Test Fix

The app public no-leak tests had drifted after World Cup market-line support shipped. Public market responses include `line`, which is a normal non-secret sports market display field.

Updated test allow-lists:

- `src/__tests__/public.market-list.no-leak.test.ts`
- `src/__tests__/public.event-markets.no-leak.test.ts`

No route behavior changed.

## Dry-Run Script Inspection

Inspected:

- `poly-bot/scripts/referenceCacheDryRun.ts`
- `poly-bot/scripts/referenceAwareLiquidityDryRun.ts`

Findings:

- `referenceCacheDryRun.ts` fetches a reference market by slug and prints quote quality from an in-memory cache.
- `referenceAwareLiquidityDryRun.ts` sets `SYSTEM_LIQUIDITY_DRY_RUN=true`, imports/reviews a reference market through admin APIs, writes a dry-run `bots.json`, upserts quote snapshots, and reports `noOrdersPlaced: true`.
- `referenceAwareLiquidityDryRun.ts` requires `POLY_SIM_SESSION_COOKIE` for admin import/review/list operations.

The authenticated dry-run script was not executed in this cycle because no local admin session cookie was provided and the Lead Agent must not invent or print secrets.

## App Boundary Evidence

`GET /api/markets/[id]/reference`:

- enforces market visibility before returning reference data;
- returns `dryRun` based on `SYSTEM_LIQUIDITY_DRY_RUN`;
- returns `liveOrdersEnabled` only when `LIVE_SYSTEM_LIQUIDITY_ENABLED=true`;
- includes the public formula:

```text
plannedBotBid = referenceBid - 2 ticks; plannedBotAsk = referenceAsk + 2 ticks
```

`GET /api/admin/reference-markets`:

- requires `assertReferenceBotAdmin`;
- returns reference review metadata and snapshot summaries only to admin users.

Public no-leak tests passed after allowing the normal public `line` display field.

## Validation Agent Decision

Status: `pass_with_warning`.

Reason:

- bot-side reference import, liquidity, and arbitrage tests pass;
- app public no-leak reference boundary tests pass;
- no live orders or live bots were enabled;
- full authenticated `liquidity:reference-dry-run` still needs a local admin session for a complete app/bot drill.

## Reviewer Decision

Decision: `continue`.

Reason:

- this PR changes docs and two test allow-lists only;
- no reference runtime behavior changed;
- no order, ledger, funding, wallet, withdrawal, settlement, or bot live behavior changed.

## Next Task

Proceed to:

```text
two-tick-worse-pricing-active-goal-tests
```

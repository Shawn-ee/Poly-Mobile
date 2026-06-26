# World Cup V2 Two-Tick Pricing Evidence

Date: 2026-06-26

Goal: `agent-orchestrator/goals/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_GOAL.md`

## Lead Agent Decision

The next active-goal task after reference sync evidence was `two-tick-worse-pricing-active-goal-tests`.

This cycle added an app-side test for the two-tick pricing rule so the evidence no longer lives only in the bot repo.

## Pricing Rule

For reference market-making previews:

```text
plannedBotBid = referenceBid - 2 ticks
plannedBotAsk = referenceAsk + 2 ticks
```

Default tick size:

```text
0.01
```

Example:

```text
referenceBid = 0.64
referenceAsk = 0.66
plannedBotBid = 0.62
plannedBotAsk = 0.68
```

The app clamps planned prices to prediction-share bounds:

```text
min = 0.01
max = 0.99
```

## Files Changed

Added:

- `src/__tests__/reference.two-tick-pricing.test.ts`

Updated:

- `agent-orchestrator/scorecards/WORLD_CUP_TRADABLE_INTERNAL_BETA_V2_SCORECARD.md`

## Test Coverage Added

The active-goal app-side test verifies:

1. bot bid is two ticks below reference bid;
2. bot ask is two ticks above reference ask;
3. default tick size is `0.01`;
4. quote offset is `2`;
5. dry-run is enabled by default;
6. live orders are disabled by default;
7. planned prices clamp to `0.01` and `0.99`;
8. missing reference book produces no quote preview and no planned bot prices.

## Validation

App repo:

```text
npx jest --runInBand src/__tests__/reference.two-tick-pricing.test.ts
```

Result:

- 1 suite passed;
- 3 tests passed.

Bot repo evidence from previous cycle remains relevant:

```text
npm run test:reference-liquidity
```

Result:

- passed.

## Safety

This cycle did not:

- enable live bots;
- place orders;
- change market-making runtime behavior;
- change funding, wallet, withdrawal, ledger, settlement, or order behavior;
- use external sportsbook APIs;
- scrape websites.

## Validation Agent Decision

Status: `pass`.

Reason:

- active app-side two-tick pricing tests pass;
- bot reference-liquidity tests already pass;
- runtime behavior remains unchanged and safe/off by default.

## Reviewer Decision

Decision: `continue`.

Reason:

- this is test/evidence work;
- pricing algorithm evidence is now available in the active app workflow;
- next task should move to World Cup-specific market-making guardrail evidence or UI/order-ticket smoke.

## Next Task

Proceed to:

```text
world-cup-market-making-guardrails
```

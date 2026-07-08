# Cycle NA - Line Provider Availability Contract

## Scope

Add structured backend/mobile contract data that tells the app whether line markets are provider-backed or Local MVP contract fixtures.

This cycle does not add fake provider lines and does not work on order book UI, chat, live sports statistics, social features, schema, or order routes.

## Problem

Repeated audits show provider-backed Regulation Winner is available, while Spread/Totals/Team Total remain contract fixtures. The route exposed status/reason text, but did not provide a structured provider availability field for future backend/provider work.

## Acceptance Criteria

- P0: `marketSourceSummary.lineMarkets.providerAvailability` exists in mobile live-detail/Home route payloads.
- P0: Current route proof shows provider availability status `unavailable`, provider-backed line count `0`, and contract-fixture line count greater than `0`.
- P0: Mobile types preserve the field.
- P0: Existing S23 Local MVP journey still passes.
- P0: No order book, chat, live stats, schema, or order route logic is touched.

## Implementation Result

Pass.

- Added `lineMarkets.providerAvailability` to the mobile market source summary.
- Updated backend and mobile contract tests.
- Route proof verifies current MVP live events expose `unavailable` provider line availability with Local MVP fixture counts.

## Evidence

- Route proof: `docs/mobile/harness/cycle-NA-line-provider-availability-contract/cycle-NA-line-provider-availability-route.json`
- S23 proof: `docs/mobile/harness/cycle-NA-line-provider-availability-contract/cycle-NA-current-mvp-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-NA-line-provider-availability-contract/`
- XML/harness: `docs/mobile/harness/cycle-NA-line-provider-availability-contract/`

## Tests

- `npx jest src/__tests__/mobile-live-event-detail.test.ts --runInBand`
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/homeCardStatsContract.test.ts mobile/src/__tests__/liveSourceReadinessContract.test.ts`
- `npm --prefix mobile exec tsc -- --noEmit --pretty false`
- `git diff --check`

## Audit Gate

Result: Pass for focused line provider availability contract.

Remaining P1:

- Actual provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket match events.

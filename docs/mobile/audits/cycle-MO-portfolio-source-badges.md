# Cycle MO - Portfolio Source Badges

## Scope

Local MVP Portfolio source disclosure after order submission.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or provider discovery breadth.

## Inspection Result

- Event Detail and Trade Ticket now show Provider/Local source state.
- Portfolio positions and history already preserved source identity in hidden labels and order-time selection snapshots.
- Users still could not visibly see whether their post-trade position/history row came from a provider-backed or local market.

## Acceptance Criteria

- P0: Portfolio position rows must visibly show `Provider` or `Local` from the order-time selection snapshot.
- P0: Portfolio history rows must visibly show `Provider` or `Local` from the order-time selection snapshot.
- P0: Badges must use `selection.referenceSource`.
- P0: Existing S23 line ticket -> swipe submit -> Portfolio/history flow must still pass.
- P1: Real provider-backed line markets still replace Local line positions/history when attach-ready candidates exist.

## Implementation Result

Pass for focused P0 scope.

- Added `portfolioSourceBadge()` in Portfolio.
- Added visible source badges to position rows.
- Added visible source badges to history rows.
- Added focused source-contract test.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MO-portfolio-source-badges/cycle-MO-current-mvp-s23-visible-flow.json`.
- S23 position screenshot: `docs/mobile/screenshots/cycle-MO-portfolio-source-badges/cycle-MO-current-mvp-after-submit.png`.
- S23 history screenshot: `docs/mobile/screenshots/cycle-MO-portfolio-source-badges/cycle-MO-current-mvp-portfolio-history.png`.
- S23 XML:
  - `docs/mobile/harness/cycle-MO-portfolio-source-badges/cycle-MO-current-mvp-after-submit.xml`
  - `docs/mobile/harness/cycle-MO-portfolio-source-badges/cycle-MO-current-mvp-portfolio-history.xml`
- Tests:
  - `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/portfolioSourceBadge.test.ts mobile/src/__tests__/portfolioHistoryService.test.ts mobile/src/__tests__/portfolioSnapshotService.test.ts mobile/src/__tests__/portfolioSyncService.test.ts`
  - `npm run -s typecheck` in `mobile/`.

Observed S23 markers:

- Position XML: `portfolio-position-source-badge`, `portfolio-source-badge-local`, visible text `Local`.
- History XML: `portfolio-history-source-badge`, `portfolio-source-badge-local`, visible text `Local`.
- Identity preserved: `portfolio-provider-source-contract-fixture`, `portfolio-line-1.5`, `portfolio-market-family-spread`.

## Audit Gate

Result: Pass for focused Portfolio source disclosure scope.

Remaining tracked P1:

- Real provider-backed Spread/Totals/Team Total candidates are still unavailable for the inspected Local MVP event.

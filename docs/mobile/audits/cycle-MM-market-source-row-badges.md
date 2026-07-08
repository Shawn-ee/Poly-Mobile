# Cycle MM - Market Source Row Badges

## Scope

Local MVP Event Detail Game Lines source clarity after the current service inspection.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or provider discovery breadth.

## Inspection Result

- Current Polymarket-first backend state remains mixed:
  - Regulation Winner is provider-backed from Polymarket.
  - Spread, Totals, and Team Total rows remain backend-shaped `contract-fixture` line markets for the inspected Local MVP event.
- Cycle ML already added a section-level banner, but individual rows still looked equally backed.

## Acceptance Criteria

- P0: Regulation Winner row must visibly identify provider-backed source.
- P0: Contract-fixture line rows must visibly identify local/server-priced source.
- P0: Existing ticket/order/Portfolio path must still pass on Samsung S23.
- P0: Order book stays hidden by default.
- P1: Replace Local line rows with real provider-backed line rows when Polymarket exposes attach-ready candidates.

## Implementation Result

Pass for focused P0 scope.

- Added compact row-level source badges to Event Detail market headers.
- Provider-backed markets render `Provider`.
- `contract-fixture` line markets render `Local`.
- Added a focused source-contract test.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MM-market-source-row-badges/cycle-MM-current-mvp-s23-visible-flow.json`.
- S23 screenshot: `docs/mobile/screenshots/cycle-MM-market-source-row-badges/cycle-MM-current-mvp-lines.png`.
- S23 XML: `docs/mobile/harness/cycle-MM-market-source-row-badges/cycle-MM-current-mvp-lines-settled.xml`.
- Tests:
  - `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
  - `npm run -s typecheck` in `mobile/`.

Observed S23 markers:

- `event-detail-market-source-regulation-time-winner market-source-badge-provider market-source-polymarket`
- Visible text: `Provider`
- `event-detail-market-source-spread market-source-badge-local market-source-contract-fixture`
- Visible text: `Local`

## Audit Gate

Result: Pass for focused market-source-row scope.

Remaining tracked P1:

- Real provider-backed Spread/Totals/Team Total candidates are still unavailable for the inspected Local MVP event.

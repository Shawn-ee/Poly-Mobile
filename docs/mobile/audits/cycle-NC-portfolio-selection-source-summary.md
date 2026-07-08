# Cycle NC - Portfolio Selection Source Summary

## Scope

Add a visible Portfolio section summary that explains whether current account selections are provider-backed, Local MVP line pricing, or mixed.

This cycle does not touch order book UI, chat, live stats, social features, backend schema, or order routes.

## Acceptance Criteria

- P0: Portfolio derives the summary from actual position, open-order, and history selection snapshots.
- P0: Local line-market selections show a compact `Local line pricing` summary above the Portfolio tabs.
- P0: S23 XML proof includes `portfolio-selection-source-summary`, `portfolio-source-summary-local-lines`, and `portfolio-local-line-count-`.
- P0: Home -> Live -> Event Detail -> line ticket -> fake-token order -> Portfolio/history still passes on S23.

## Implementation Result

Pass.

- Added `portfolioSourceSummary()` in `mobile/src/components/Portfolio.tsx`.
- Portfolio now shows a compact source strip above the Positions/Orders/History tabs when selections exist.
- The strip is derived from order-time selection snapshots and does not invent backend/provider state.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-NC-portfolio-selection-source-summary/cycle-NC-current-mvp-s23-visible-flow.json`
- Screenshots: `docs/mobile/screenshots/cycle-NC-portfolio-selection-source-summary/`
- XML/harness: `docs/mobile/harness/cycle-NC-portfolio-selection-source-summary/`

## Tests

- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/portfolioSourceBadge.test.ts`
- `npm --prefix mobile exec tsc -- --noEmit --pretty false`
- `git diff --check`

## Audit Gate

Result: Pass for focused visible Portfolio source summary.

Remaining P1:

- Actual provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket match events.

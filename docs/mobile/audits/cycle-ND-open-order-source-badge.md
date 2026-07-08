# Cycle ND - Open Order Source Badge

## Scope

Make Portfolio open-order rows show the same Local/Provider source badge and source note already used by positions and history.

This cycle does not touch order book UI, chat, live stats, social features, backend schema, or order routes.

## Acceptance Criteria

- P0: Open order rows render a source badge derived from the order-time `selection.referenceSource`.
- P0: Contract-fixture line orders show `Local` and `Local test pricing`.
- P0: The row preserves selected market type, line, period, source, token, and cancel button identity.
- P0: S23 proof shows the open order row, source badge, source note, and cancel button on the current Local MVP match path.

## Implementation Result

Pass.

- Added source badge and note rendering to Portfolio open-order rows.
- Reused existing order-time selection snapshot data; no backend or order-route behavior changed.
- Focused S23 proof shows the open order row with `Local`, `Local test pricing`, selected Spread line identity, and Cancel.

## Evidence

- Focused proof: `docs/mobile/harness/cycle-ND-open-order-source-badge/cycle-ND-open-order-source-badge-proof.json`
- Focused S23 XML: `docs/mobile/harness/cycle-ND-open-order-source-badge/cycle-ND-current-mvp-after-submit.xml`
- Focused S23 screenshot: `docs/mobile/screenshots/cycle-ND-open-order-source-badge/cycle-ND-current-mvp-after-submit.png`

## Tests

- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/portfolioSourceBadge.test.ts mobile/src/__tests__/openOrderService.test.ts`
- `npm --prefix mobile exec tsc -- --noEmit --pretty false`
- `git diff --check`

## Audit Gate

Result: Pass for focused visible open-order source badge scope.

Notes:

- The reusable current-MVP proof script continued into History and failed a non-gating empty-history assertion. The focused ND gate is proven by the after-submit open-order XML/screenshot.
- Before the final focused proof, stale open SELL liquidity on the selected `Egypt +1.5` proof outcome was cleared so the mobile BUY rested as an open order instead of filling.

Remaining P1:

- Actual provider-backed Spread/Totals/Team Total markets remain unavailable for inspected Polymarket match events.

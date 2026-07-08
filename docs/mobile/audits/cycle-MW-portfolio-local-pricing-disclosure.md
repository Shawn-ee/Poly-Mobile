# Cycle MW - Portfolio Local Pricing Disclosure

## Scope

Make local line-market pricing disclosure visible in Portfolio positions and History after a completed fake-token order.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or non-MVP polish.

## Why

Cycles MU and MV disclosed `Local test pricing` on Event Detail and Trade Ticket. The same source state needs to remain visible after the trade so Portfolio and History do not make a contract-fixture line position look provider-backed.

## Acceptance Criteria

- P0: A Portfolio position created from a `contract-fixture` line market shows `Local test pricing`.
- P0: A History activity row created from the same order shows `Local test pricing`.
- P0: Android UI hierarchy exposes `portfolio-local-test-pricing`.
- P0: Existing Portfolio/history identity markers still preserve market type, line, period, outcome, and source.
- P0: No backend route/schema/order logic is changed.

## Implementation Result

Pass.

- Added `portfolioSourceNote()` in `Portfolio.tsx`.
- Contract-fixture positions/history rows now show `Local test pricing`.
- Provider-backed rows show `Provider market`.
- Updated S23 proof assertions for Portfolio/history disclosure.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MW-portfolio-local-pricing-disclosure/cycle-MW-current-mvp-s23-visible-flow.json`.
- Counterparty proof: `docs/mobile/harness/cycle-MW-portfolio-local-pricing-disclosure/cycle-MW-current-mvp-counterparty.json`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-MW-portfolio-local-pricing-disclosure/`, `docs/mobile/harness/cycle-MW-portfolio-local-pricing-disclosure/`.
- Tests:
  - `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` parse check
  - `npm --prefix mobile exec tsc -- --noEmit --pretty false`
  - `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/marketListsHomeCardSelections.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`

## Audit Gate

Result: Pass for focused Portfolio/history local-pricing disclosure.

Remaining P1:

- Real provider-backed Spread/Totals/Team Total line markets remain unavailable for inspected events.
- The disclosure does not replace future provider mapping work.

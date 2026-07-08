# Cycle MU - Line Local Pricing Disclosure

## Scope

Make current Local MVP line markets visibly honest on Event Detail.

This cycle does not work on order book UI, chat, live stats, social features, backend schema, or non-MVP polish.

## Why

Current service inspection shows Regulation Winner is provider-backed, but Spread/Totals/Team Total markets for inspected matches are local `contract-fixture` rows. The UI already had a small `Local` pill, but it was too easy to miss. This cycle adds a visible row-header note so users can tell line rows are local test pricing before opening a ticket.

## Acceptance Criteria

- P0: Contract-fixture line market headers show `Local test pricing`.
- P0: The disclosure is exposed in Android UI hierarchy as `line-market-local-test-pricing`.
- P0: Order book/chat remain hidden.
- P0: Existing local line ticket flow still opens, swipes to buy, fills against local proof liquidity, and appears in Portfolio/history.
- P0: No backend route/schema/order logic is changed.

## Implementation Result

Pass.

- Added `marketSourceHeaderNote()` in `EventDetail.tsx`.
- Spread/Totals/Team Total rows backed by `contract-fixture` now show `Local test pricing` under the market subtitle.
- Provider-backed rows show `Provider market`.
- Updated S23 proof assertions for the visible local-pricing disclosure.

## Evidence

- S23 proof: `docs/mobile/harness/cycle-MU-line-local-pricing-disclosure/cycle-MU-current-mvp-s23-visible-flow.json`.
- Counterparty proof: `docs/mobile/harness/cycle-MU-line-local-pricing-disclosure/cycle-MU-current-mvp-counterparty.json`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-MU-line-local-pricing-disclosure/`, `docs/mobile/harness/cycle-MU-line-local-pricing-disclosure/`.
- Tests:
  - `scripts/prove_mobile_current_mvp_s23_visible_flow.ps1` parse check
  - `npm --prefix mobile exec tsc -- --noEmit --pretty false`
  - `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/marketListsHomeCardSelections.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`

## Audit Gate

Result: Pass for focused Local MVP line-source disclosure.

Remaining P1:

- Real provider-backed Spread/Totals/Team Total line markets remain unavailable for inspected events.
- The Local line disclosure does not replace future provider mapping work.

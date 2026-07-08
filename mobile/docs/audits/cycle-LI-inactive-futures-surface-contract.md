# Cycle LI - Inactive Futures Surface Contract

Gate status: Pass

Scope: Cleanup/consolidation for the visible Home surface. This cycle removes the old inactive Home Futures tab/list/chart source so the app does not carry a hidden frontend-only market surface without a backend route contract.

## P0 Checklist

- Home does not receive or render the old `worldCupTab` / Futures tab state.
- The unused Featured Future and World Cup segmented components are removed.
- The unused `FutureList` chart/range/outcome-volume UI is removed from `MarketLists`.
- Backend-driven Home match cards, regulation/advance selection, retail outcome rail, filters, pagination, save controls, and ticket entry remain intact.
- No order book, chat, live stats product, Portfolio redesign, deposit, withdrawal, or broad backend schema work was added.

## Evidence

- Proof: `docs/mobile/harness/cycle-LI-inactive-futures-surface-contract/cycle-LI-inactive-futures-surface-contract.json`.
- Proof script: `scripts/prove_mobile_inactive_futures_surface_contract.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/inactiveFuturesSurfaceContract.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for inactive Futures surface cleanup.
- Remaining P1: if Futures browsing returns as a visible MVP page, it must use backend-owned market catalog, quote, ordering, volume/liquidity, and ticket contract ids instead of local outcome/stat invention.

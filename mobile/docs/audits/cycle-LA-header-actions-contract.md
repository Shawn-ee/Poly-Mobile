# Cycle LA - Header Actions Contract

Gate status: Pass

Scope: Backend/data-contract gate for visible Header actions. This cycle removes unsupported local-only promo and notification controls. The remaining visible Header action is language switching, which is covered by the existing preference path.

## P0 Checklist

- Header does not expose a promo/credit-claim action without backend support.
- Header does not expose a notification action without backend support.
- Header does not maintain local fake feedback for removed promo/notification actions.
- Header still exposes language switching.
- `App` no longer passes promo copy into `Header`.
- Promo/rewards and notifications are documented as future scope only if MVP scope expands.

## Evidence

- Proof: `docs/mobile/harness/cycle-LA-header-actions-contract/cycle-LA-header-actions-contract.json`.
- Proof script: `scripts/prove_mobile_header_actions_contract.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/headerContract.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Header actions contract.
- Remaining P1: promo/rewards/claim-credit and notifications only if MVP scope expands; optional Android proof if visual proof becomes required again.

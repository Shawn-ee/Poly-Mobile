# Cycle LG - Home Card Stats Contract

Gate status: Pass

Scope: Backend/data-contract gate for active Home match cards. This cycle removes hidden local-MVP volume/liquidity stats generated on the frontend and keeps Home cards tied to route-fed event identity, backend-driven market profile selection, filters, pagination, and ticket navigation.

## P0 Checklist

- Home match cards do not compute frontend-invented volume or liquidity.
- Home match cards do not attach hidden local-MVP stat proof markers.
- Home card market selection still uses backend event rules/profile fields.
- Home filters and pagination remain intact.
- No order book, chat, live stats, portfolio redesign, deposit, withdrawal, or broad schema work was added.

## Evidence

- Proof: `docs/mobile/harness/cycle-LG-home-card-stats-contract/cycle-LG-home-card-stats-contract.json`.
- Proof script: `scripts/prove_mobile_home_card_stats_contract.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/homeCardStatsContract.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Home card stats contract.
- Remaining P1: inactive Futures catalog components still contain local fallback volume/chart presentation and should be handled only if that UI is restored to the visible MVP.

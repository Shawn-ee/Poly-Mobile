# Cycle LD - Portfolio Settings Contract

Gate status: Pass

Scope: Backend/data-contract gate for visible Portfolio account/settings affordances. This cycle removes the duplicate local-only Portfolio gear and settings sheet while leaving the Portfolio layout and route-backed data surfaces intact.

## P0 Checklist

- Portfolio does not show a duplicate `portfolio-settings` gear.
- Portfolio does not show a local-only account settings sheet.
- Portfolio does not show local-only fake-token/funding settings rows.
- Portfolio keeps profile identity display, value chart, Positions/Orders/History tabs, cashout, buy, and cancel controls.
- Account/preferences remain owned by the Account screen and its existing backend-backed contracts.

## Evidence

- Proof: `docs/mobile/harness/cycle-LD-portfolio-settings-contract/cycle-LD-portfolio-settings-contract.json`.
- Proof script: `scripts/prove_mobile_portfolio_settings_contract.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/portfolioSettingsContract.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Portfolio settings contract.
- Remaining P1: broader account/security/session/funding settings only if MVP scope expands; optional Android proof if visual proof becomes required again.

# Cycle LC - Account Static Rows Contract

Gate status: Pass

Scope: Backend/data-contract gate for visible Account static rows. This cycle removes unsupported hardcoded Theme, security teaser, and duplicate fake-token rows while keeping Account rows backed by profile preferences, profile summary, or trading-mode state.

## P0 Checklist

- Account does not show hardcoded `Theme: Dark`.
- Account does not show a security-settings teaser without a backend contract.
- Account does not show a duplicate static fake-token row.
- Account keeps preference-backed language, saved markets, ticket defaults, and profile sync rows.
- Account keeps summary-backed portfolio/account values.
- Account keeps the visible trading-mode row.

## Evidence

- Proof: `docs/mobile/harness/cycle-LC-account-static-rows-contract/cycle-LC-account-static-rows-contract.json`.
- Proof script: `scripts/prove_mobile_account_static_rows_contract.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/accountStaticRowsContract.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Account static rows contract.
- Remaining P1: theme/security routes only if MVP scope expands; optional Android proof if visual proof becomes required again.

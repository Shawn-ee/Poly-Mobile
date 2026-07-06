# Cycle LB - Account Auth Visibility Contract

Gate status: Pass

Scope: Backend/data-contract gate for visible Account auth actions. This cycle removes local-only login/signup/sign-out controls and keeps Account auth display derived from the existing `/api/profile/summary` route wiring.

## P0 Checklist

- Account does not store a local mock signed-in state in AsyncStorage.
- Account does not expose Log In, Sign Up, or Sign Out buttons without backend auth support.
- Signed-in display is derived from the app-level `forceSignedIn` prop.
- `forceSignedIn` is set by successful profile summary loading in server mode.
- Account keeps visible auth-unavailable copy when no server profile is loaded.
- Copy no longer claims mock login is active or ready.

## Evidence

- Proof: `docs/mobile/harness/cycle-LB-account-auth-visibility-contract/cycle-LB-account-auth-visibility-contract.json`.
- Proof script: `scripts/prove_mobile_account_auth_visibility_contract.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/accountAuthContract.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Account auth visibility contract.
- Remaining P1: full login/signup/logout/session/KYC only if MVP scope expands; optional Android proof if visual proof becomes required again.

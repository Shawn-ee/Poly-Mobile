# Cycle JU - Profile Preferences Route Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Account/settings preference fields that are visible or user-affecting in the mobile app.
- Mobile mapping between local state and canonical backend `ProfilePreferences`.
- Backend route parsing, auth scopes, and validation for `/api/profile/preferences`.
- No account/settings visual redesign, wallet/KYC/auth menu expansion, deposits, or withdrawals.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Mobile can serialize local profile preferences into the backend payload shape | Pass | `mobile/src/__tests__/profilePreferencesService.test.ts` and `docs/mobile/harness/cycle-JU-profile-preferences-route-contract/cycle-JU-profile-preferences-route-contract.json`. |
| Backend accepts only canonical preference payloads | Pass | `src/__tests__/profile.preferences.route.test.ts` covers valid saves and incomplete payload rejection; proof script exercises `parseProfilePreferencesInput()`. |
| Route uses account scopes for server-mode mobile reads/writes | Pass | `src/__tests__/profile.preferences.route.test.ts` asserts `GET` uses `account:read` and `PUT` uses `account:write`. |
| Legacy preference payloads remain safe for mobile | Pass | Mobile service tests and proof default missing `ticketDefaultSlippage` to `1%`. |
| The cycle does not introduce frontend-only account/settings state as the server contract | Pass | Proof uses canonical payload shape and existing backend parser; no UI files were changed. |

## Change Notes

- Added a focused JU proof script for the mobile account/settings preference payload contract.
- This cycle intentionally does not touch dirty account/Portfolio UI files or expand account settings beyond the existing visible preference contract.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/profilePreferencesService.test.ts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/profile.preferences.route.test.ts src/server/services/__tests__/profilePreferences.test.ts` - pass.
- `npx tsx scripts/prove_mobile_profile_preferences_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle JU"` - pass.

## Remaining P1

- Full account/settings shell data contract for profile identity, login/session state, notification preferences, wallet controls, and security settings.
- UI-level server sync proof after the current unrelated mobile UI churn is reconciled.

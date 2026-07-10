# Cycle SB - Secure Mobile Auth Credential Storage

## Scope

Local MVP account continuity after Google auth return, with the backend-owned Google Cloud OAuth flow unchanged. The mobile app stores only the Holiwyn mobile API credential returned by the backend; Google credential and token exchange remain server-side.

## Reference Behavior

- Polymarket keeps a user session across app restarts.
- Account state is visible from the Portfolio/account area.
- Signing out returns the account entry to a signed-out state.

## Holiwyn Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Mobile must use the backend `/api/auth/google/start` and callback-return credential flow rather than embedding Google Cloud secrets in the app. | Pass |
| P0 | A backend-returned Holiwyn mobile API credential must persist across app restart. | Pass |
| P0 | Sign out must remove the persisted mobile credential and return the Portfolio account row to `Continue with Google`. | Pass |
| P1 | Credential persistence should use native secure storage when available, with legacy AsyncStorage migration fallback for existing local tester installs. | Pass |
| P1 | Full interactive Google consent on S23 should be manually verified against a real Google account session. | Open |

## Implementation Notes

- Added `mobile/src/services/mobileCredentialStore.ts`.
- The credential store uses `expo-secure-store` when available.
- Legacy `AsyncStorage` credential data is migrated into SecureStore and removed.
- Sign-out deletes both SecureStore and legacy AsyncStorage values.
- `mobile/App.tsx` now loads, stores, and clears the mobile API credential through the credential store.

## Device Proof

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM_S911U1`.
- Summary: `docs/mobile/harness/cycle-SB-secure-auth-storage/cycle-SB-google-auth-return-summary.json`.
- Screenshots:
  - `docs/mobile/screenshots/cycle-SB-secure-auth-storage/cycle-SB-google-auth-return-portfolio.png`
  - `docs/mobile/screenshots/cycle-SB-secure-auth-storage/cycle-SB-google-auth-persisted-portfolio.png`
  - `docs/mobile/screenshots/cycle-SB-secure-auth-storage/cycle-SB-google-auth-account-signed-out.png`
- XML:
  - `docs/mobile/harness/cycle-SB-secure-auth-storage/cycle-SB-google-auth-return-portfolio.xml`
  - `docs/mobile/harness/cycle-SB-secure-auth-storage/cycle-SB-google-auth-persisted-portfolio.xml`
  - `docs/mobile/harness/cycle-SB-secure-auth-storage/cycle-SB-google-auth-account-connected.xml`
  - `docs/mobile/harness/cycle-SB-secure-auth-storage/cycle-SB-google-auth-account-signed-out.xml`

## Audit Gate

- Result: Pass for SB scope.
- Unresolved P0 gaps: 0.
- Remaining P1 gaps: real interactive Google consent on S23, provider-backed current-match line markets, production liquidity/public market-maker policy.

# Cycle TR - Google Auth Tracker Cleanup

Status: contract/docs pass, no visible Android UI change.

## Scope

This cycle follows the user's instruction that Holiwyn mobile Google login should use the same Poly/Holiwyn backend Google Cloud credential and token exchange. No separate mobile Google client credential, Google token, or mobile-side token exchange is introduced.

It also cleans stale parity debt: older tracker rows still said the Holiwyn API key was stored only in app storage, even though Cycle SB moved the active path to Expo SecureStore with legacy AsyncStorage migration.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Mobile opens backend `/api/auth/google/start` and does not own Google token exchange. | Pass |
| P0 | Backend `/api/auth/google/callback` owns `GOOGLE_CLIENT_SECRET`, Google code exchange, Google userinfo fetch, user linking, and mobile API-key minting. | Pass |
| P0 | Mobile stores only the returned Holiwyn API key, not Google access/refresh tokens. | Pass |
| P0 | SecureStore is the primary mobile credential storage when available. | Pass |
| P1 | Legacy AsyncStorage credential data is migration/fallback only and is removed after SecureStore migration. | Pass |
| P1 | Gap tracker no longer reports secure native credential storage as open after Cycle SB evidence. | Pass |

## API/Data Dependencies

| Mobile function | Route/service | Contract |
| --- | --- | --- |
| Start Google login | `GET /api/auth/google/start` | Accepts `mobileReturnTo`, stores OAuth cookies, redirects to Google with backend callback. |
| Complete Google login | `GET /api/auth/google/callback` | Exchanges code with Google using server env, creates/links Holiwyn user, creates mobile `ApiCredential`, redirects to allowed mobile return with `apiKey`. |
| Store returned credential | `storeMobileAuthApiKey()` | Uses Expo SecureStore when available; removes legacy AsyncStorage value after migration. |
| Rehydrate credential | `loadMobileAuthApiKey()` | Reads SecureStore first; migrates legacy AsyncStorage if present. |
| Clear credential | `clearMobileAuthApiKey()` and `POST /api/auth/mobile/logout` | Deletes SecureStore and legacy AsyncStorage key; backend revokes the current key when authenticated. |

## Proof

- Focused tests passed:
  - `mobile/src/__tests__/googleMobileAuthContract.test.ts`
  - `mobile/src/__tests__/googleMobileReturnAllowlist.test.ts`
  - `mobile/src/__tests__/accountAuthContract.test.ts`
  - `mobile/src/__tests__/portfolioGoogleAuthReturnContract.test.ts`
- Server-auth config check passed: `npm run check:server-auth --if-present`.

## Remaining Gaps

| Gap | Priority | Status | Note |
| --- | --- | --- | --- |
| Real interactive Google consent on S23 | P1 | Open | Requires a real browser consent session and Google Cloud authorized redirect URI pointing to the exact reachable backend auth origin. |
| Production auth hardening | P2 | Open | Later dev build/APK can decide whether SecureStore should require biometric/device authentication and whether logout revokes all mobile Google credentials or only the current key. |

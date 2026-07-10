# Cycle SD - Account Fake-Token Copy and Google Credential Alignment

## Scope

Local MVP Portfolio/Account account copy and Google login credential handling.

This cycle keeps Holiwyn aligned with the existing Poly/Holiwyn backend Google OAuth model: the mobile app opens the backend auth route, the backend uses the shared Google Cloud OAuth client credentials, and the mobile app receives only a Holiwyn API credential after callback.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Mobile must not contain Google Cloud client secrets or Google access tokens. | Pass |
| P0 | Google login must continue to route through backend `/api/auth/google/start` and callback-shaped return. | Pass |
| P0 | Returned Holiwyn mobile credential persists after restart and clears on sign-out. | Pass |
| P0 | Visible Account copy must not mention deposits/withdrawals during the Local MVP. | Pass |
| P0 | Signed-out state must show `Continue with Google` after logout. | Pass |
| P1 | Real interactive Google browser consent on S23 should be manually proven with the configured Google Cloud redirect URI. | Open |

## Implementation Notes

- `mobile/src/localization/appCopy.ts` now uses fake-token MVP account copy instead of deposit/withdraw-disabled wording.
- `mobile/src/components/Portfolio.tsx` removes dormant deposit/withdraw copy/styles while preserving the hidden Local MVP funding marker.
- `scripts/prove_mobile_google_auth_return_s23.ps1` verifies connected, persisted, and signed-out Google states on S23.

## Backend/API Notes

- No backend route or schema changed.
- Existing route dependency remains `/api/auth/google/start` -> Google OAuth -> `/api/auth/google/callback` -> `holiwyn://auth/google?...apiKey=<redacted>`.
- Backend owns `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, token exchange, user linking/creation, and Holiwyn API credential creation.
- Mobile stores only the returned Holiwyn API key through SecureStore.

## Proof

- Summary: `docs/mobile/harness/cycle-SD-account-fake-token-copy/cycle-SD-google-auth-return-summary.json`
- Screenshots: `docs/mobile/screenshots/cycle-SD-account-fake-token-copy/`
- XML: `docs/mobile/harness/cycle-SD-account-fake-token-copy/`
- Device: Samsung S23 `SM_S911U1`
- Result: Pass with 0 unresolved P0 gaps for this scope.

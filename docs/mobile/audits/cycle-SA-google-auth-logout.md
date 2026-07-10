# Cycle SA - Google Account Sign-Out and Mobile Credential Revocation

## Scope

Local MVP account sign-out for a backend-returned Google mobile credential.

Out of scope: order book, chat, live stats, social features, deposit/withdraw, provider line-market discovery, real Google browser consent, and production secure storage.

## Reference / Direction

- Product direction: Google login uses the same backend Google Cloud OAuth flow as Poly/Holiwyn.
- Cycle RZ made the returned Holiwyn API key persistent.
- SA closes the reversible-account-state gap: testers must be able to clear that persisted connected state.

## Acceptance Criteria

| Criterion | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Connected Account UI exposes a sign-out action. | P0 | Pass | `mobile/src/components/AccountScreen.tsx`; S23 connected Account XML |
| Sign-out clears the persisted Holiwyn mobile credential. | P0 | Pass | `mobile/App.tsx`; S23 signed-out proof |
| Sign-out resets runtime connected/profile state. | P0 | Pass | `mobile/App.tsx`; signed-out XML rejects connected markers |
| Backend route revokes the current mobile API key when authenticated by that key. | P0 | Pass | `src/app/api/auth/mobile/logout/route.ts`; focused source contract |
| After sign-out, visible UI returns to `Continue with Google`. | P0 | Pass | `docs/mobile/screenshots/cycle-SA-google-auth-logout/cycle-SA-google-auth-account-signed-out.png` |
| No mobile Google client secret or Google access token is added. | P0 | Pass | focused auth tests and source scan |
| Real Google browser consent is completed on S23. | P1 | Open | requires interactive manual/real-account proof |
| Stored credential uses native secure storage. | P1 | Open | future dev build/APK hardening |

## Implementation Notes

- Added `POST /api/auth/mobile/logout`.
- Added `PolyApi.logoutMobile()`.
- Added Account connected-row sign-out action.
- Added `signOutGoogle` in `mobile/App.tsx`; it calls backend logout best-effort, removes `holiwyn.mobileAuthApiKey.v1`, resets runtime key/profile state, and hides API-key diagnostics.
- Updated `scripts/prove_mobile_google_auth_return_s23.ps1` with `-VerifyLogout`.

## Device Proof

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM_S911U1`.
- Proof summary: `docs/mobile/harness/cycle-SA-google-auth-logout/cycle-SA-google-auth-return-summary.json`.
- Connected Account XML before sign-out: `docs/mobile/harness/cycle-SA-google-auth-logout/cycle-SA-google-auth-account-connected.xml`.
- Signed-out screenshot: `docs/mobile/screenshots/cycle-SA-google-auth-logout/cycle-SA-google-auth-account-signed-out.png`.
- Signed-out XML: `docs/mobile/harness/cycle-SA-google-auth-logout/cycle-SA-google-auth-account-signed-out.xml`.

## Audit Result

P0 pass for this cycle scope. Remaining P1 gaps are real interactive Google consent and secure native credential storage before broader distribution.

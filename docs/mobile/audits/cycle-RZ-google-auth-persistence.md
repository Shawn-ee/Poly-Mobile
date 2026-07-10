# Cycle RZ - Google Auth Return Persistence

## Scope

Local MVP Portfolio/account continuity after the backend-owned Google auth callback returns a Holiwyn mobile API credential.

Out of scope: order book, chat, live stats, social features, deposit/withdraw, provider line-market discovery, production logout/revocation UI, and real interactive Google consent.

## Reference / Direction

- Product direction: Google login should use the same backend Google Cloud credential and token-exchange logic as Poly/Holiwyn.
- Backend source of truth: `/api/auth/google/start` and `/api/auth/google/callback`.
- Mobile must not include Google client secrets or Google access tokens.
- Mobile may store only the Holiwyn API credential returned by the backend callback for Local MVP server-mode use.

## Acceptance Criteria

| Criterion | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Mobile launches backend Google auth with a Holiwyn mobile return target. | P0 | Pass | `mobile/src/__tests__/googleMobileAuthContract.test.ts` |
| Backend keeps Google token exchange server-side with `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`. | P0 | Pass | `src/app/api/auth/google/start/route.ts`; `src/app/api/auth/google/callback/route.ts` |
| Returned Holiwyn mobile API key is persisted on device. | P0 | Pass | `mobile/App.tsx`; focused test |
| App restart without passing `apiKey` again still opens Portfolio as connected. | P0 | Pass | S23 proof summary and persisted screenshot |
| `/api/profile/summary` can load through the hydrated runtime key. | P0 | Pass | S23 XML shows `Server profile loaded`; profile service test |
| Mobile does not add Google Cloud client secrets. | P0 | Pass | focused auth contract test |
| Logout/token revocation exists. | P1 | Open | tracked in gap tracker |
| Real Google consent is completed on S23. | P1 | Open | requires interactive manual/real-account proof |

## Implementation Notes

- Added `MOBILE_AUTH_API_KEY_STORAGE_KEY` in `mobile/App.tsx`.
- When a callback-shaped launch URL includes `apiKey`, the app sets the runtime PolyApi key and stores it.
- On app start, if no build-time `EXPO_PUBLIC_API_KEY` is configured, the app rehydrates the stored Holiwyn key and marks the account path connected.
- Updated `scripts/prove_mobile_google_auth_return_s23.ps1` with `-Cycle` and `-VerifyPersistence`; the proof force-stops Expo Go and reopens Portfolio without passing `apiKey`.

## Device Proof

- Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM_S911U1`.
- Proof summary: `docs/mobile/harness/cycle-RZ-google-auth-persistence/cycle-RZ-google-auth-return-summary.json`.
- Immediate return screenshot: `docs/mobile/screenshots/cycle-RZ-google-auth-persistence/cycle-RZ-google-auth-return-portfolio.png`.
- Persisted restart screenshot: `docs/mobile/screenshots/cycle-RZ-google-auth-persistence/cycle-RZ-google-auth-persisted-portfolio.png`.
- Persisted restart XML: `docs/mobile/harness/cycle-RZ-google-auth-persistence/cycle-RZ-google-auth-persisted-portfolio.xml`.

## Audit Result

P0 pass for this cycle scope. Remaining P1 gaps are real interactive Google consent, logout/revocation, and secure native credential storage before broader distribution.

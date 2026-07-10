# Cycle TH - Google Auth Poly Credential Setup

Status: source/config proof pass, no visible Android UI change.

## Scope

The user asked Google login setup to use the same logic, credential, and Google Cloud token flow that appear in Poly. This cycle confirms and tightens the existing mobile contract:

- Holiwyn Mobile opens the backend `/api/auth/google/start` route.
- The backend uses the existing Poly/Holiwyn `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`, Google code exchange, and userinfo request.
- The backend mints a Holiwyn mobile API credential after successful Google login.
- The mobile app stores only the returned Holiwyn API credential and uses it as a Bearer token for Holiwyn API calls.
- Google Cloud client secrets, Google access tokens, and Google refresh tokens stay out of the mobile app.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Mobile does not read or expose a Google client secret/access token. | Pass |
| P0 | Mobile launches backend Google OAuth instead of using a separate mobile Google client flow. | Pass |
| P0 | Backend Google start/callback routes use server-owned `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. | Pass |
| P0 | Backend exchanges the Google code server-side and fetches Google userinfo server-side. | Pass |
| P0 | Backend returns only a Holiwyn mobile API credential through an allowlisted mobile deep link. | Pass |
| P1 | README and env examples explicitly instruct reuse of the existing Poly/Holiwyn Google Cloud OAuth client. | Pass |

## API/Data Dependencies

| Feature | Route | Method | Auth | Contract |
| --- | --- | --- | --- | --- |
| Start Google login | `/api/auth/google/start` | GET | Public | Accepts `mobileReturnTo`; redirects to Google OAuth with backend callback. |
| Complete Google login | `/api/auth/google/callback` | GET | Google OAuth state cookie | Exchanges code with Google, loads userinfo, creates/links Holiwyn user, returns `googleAuth=success` and `apiKey` to mobile when `mobileReturnTo` is allowlisted. |
| Authenticated mobile API calls | Holiwyn API routes such as `/api/profile/summary`, `/api/portfolio`, `/api/orders` | GET/POST | `Authorization: Bearer <Holiwyn mobile API credential>` | Mobile uses the Holiwyn API credential, not a Google access token. |

## Proof

- `mobile/scripts/check-server-auth-config.ps1` now checks that mobile docs/config continue to use backend-owned Google OAuth and do not drift toward a mobile-owned secret flow.
- Focused tests cover `mobile/src/__tests__/googleMobileAuthContract.test.ts`, `mobile/src/__tests__/googleMobileReturnAllowlist.test.ts`, `mobile/src/__tests__/portfolioGoogleAuthReturnContract.test.ts`, and `mobile/src/__tests__/mobileGoogleLogoutContract.test.ts`.

## Remaining Gaps

- P1: Manual Google login on S23 still requires the backend auth URL and Google Cloud authorized redirect URI to point at a device-reachable backend origin.
- P2: Native dev build should use `holiwyn://auth/google`; Expo Go testing may use an `exp:` or `exps:` return URL only outside production.

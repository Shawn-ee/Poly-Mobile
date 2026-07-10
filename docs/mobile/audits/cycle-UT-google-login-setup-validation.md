# Cycle UT - Google Login Setup Validation

Date: 2026-07-10

## Scope

Validate the current Holiwyn mobile Google login setup against the product direction: use the same Poly/Holiwyn backend Google Cloud OAuth credential and token exchange, without adding Google credentials or Google tokens to the Expo/mobile app.

This cycle does not redesign auth, does not add a separate mobile Google client, and does not touch trading, order book, chat, live stats, deposit, or withdrawal behavior.

## Reference / Expected Behavior

The mobile app should behave like the existing Poly/Holiwyn Google flow:

1. User taps `Continue with Google` from Portfolio/account.
2. Mobile opens the backend `/api/auth/google/start` route.
3. Backend redirects to Google using server-side `GOOGLE_CLIENT_ID`.
4. Backend receives `/api/auth/google/callback`, exchanges the code using server-side `GOOGLE_CLIENT_SECRET`, fetches Google userinfo, and creates/links the Holiwyn user.
5. Backend mints a Holiwyn mobile API credential.
6. Backend returns to mobile through the configured deep link with `googleAuth=success` and a Holiwyn API key.
7. Mobile stores only the Holiwyn API key and uses it as the Bearer credential for server-backed profile, Portfolio, order, and history routes.

## Acceptance Criteria

| ID | Priority | Criterion | Evidence | Result |
| --- | --- | --- | --- | --- |
| UT-P0-01 | P0 | Mobile opens backend Google auth and includes a mobile return URL. | `mobile/App.tsx`; focused auth contract test. | Pass |
| UT-P0-02 | P0 | Mobile does not contain `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_CLIENT_SECRET`, Google access tokens, or Google refresh tokens. | Auth preflight and focused contract test. | Pass |
| UT-P0-03 | P0 | Backend start/callback routes own `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, Google token exchange, and userinfo fetch. | `src/app/api/auth/google/start/route.ts`; `src/app/api/auth/google/callback/route.ts`. | Pass |
| UT-P0-04 | P0 | Backend creates a Holiwyn mobile API credential after successful Google auth. | Callback route and focused contract test. | Pass |
| UT-P0-05 | P0 | Mobile stores only the returned Holiwyn API credential and can clear it on logout. | `mobile/src/services/mobileCredentialStore.ts`; mobile logout contract test. | Pass |
| UT-P0-06 | P0 | Setup docs explain the backend/mobile ownership split and required environment variables. | `docs/mobile/GOOGLE_LOGIN_SETUP.md`; `mobile/README.md`; `.env.example`; `mobile/.env.example`. | Pass |
| UT-P1-01 | P1 | Real Google consent flow is manually proven on Samsung S23. | Requires ADB-visible S23 and Google Cloud callback URL registration. | Open |

## API / Data Dependencies

| Mobile feature | Route | Method | Auth | Request/params | Response/return consumed |
| --- | --- | --- | --- | --- | --- |
| Portfolio/account Google entry | `/api/auth/google/start` | `GET` | None | `returnTo=/portfolio`, `mobileReturnTo=<deep-link>` | Redirect to Google OAuth |
| Backend Google callback | `/api/auth/google/callback` | `GET` | Google OAuth state/code | `code`, `state` | Redirect to mobile deep link with `googleAuth=success`, `holiwynApiKey`, and compatibility `apiKey` |
| Mobile server profile/Portfolio after return | Existing profile, Portfolio, order, and history routes | Mixed | Bearer Holiwyn API key | Runtime `PolyApi` uses stored key | Server-backed account/Portfolio state |
| Logout | `/api/auth/mobile/logout` | `POST` | Bearer Holiwyn API key | Existing credential | Server logout best-effort plus local SecureStore clear |

## Proof

- `npm run test:mobile-api -- --run mobile/src/__tests__/googleMobileAuthContract.test.ts mobile/src/__tests__/googleMobileReturnAllowlist.test.ts mobile/src/__tests__/portfolioGoogleAuthReturnContract.test.ts mobile/src/__tests__/mobileGoogleLogoutContract.test.ts mobile/src/__tests__/accountAuthContract.test.ts mobile/src/__tests__/portfolioSettingsContract.test.ts`
- `powershell -ExecutionPolicy Bypass -File mobile/scripts/check-server-auth-config.ps1`
- Android device check: `adb devices -l` currently reports no attached device, so S23 real consent proof remains P1.

## Audit Gate

P0 result: Pass for setup/source/contract scope.

Unresolved P0 gaps: 0 for this scope.

Remaining P1: run real S23 Google consent proof after the S23 is visible to ADB and the backend callback URL in `NEXTAUTH_URL` is registered in the same Google Cloud OAuth client.

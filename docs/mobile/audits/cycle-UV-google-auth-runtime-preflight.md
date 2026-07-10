# Cycle UV - Google Auth Runtime Preflight

Date: 2026-07-10

## Scope

Add a no-secret runtime preflight for the existing backend-owned Google login flow so manual Samsung S23 proof can fail fast on backend/callback configuration before opening a real Google consent session.

This cycle does not change OAuth semantics, does not add mobile-owned Google credentials, and does not touch trading, order book, chat, live stats, deposit, or withdrawal behavior.

## Reference / Expected Behavior

Holiwyn mobile should keep using the same Poly/Holiwyn backend Google OAuth setup:

1. Mobile opens `/api/auth/google/start`.
2. Backend reads server-side `GOOGLE_CLIENT_ID`.
3. Backend redirects to Google.
4. The Google `redirect_uri` points exactly to `NEXTAUTH_URL/api/auth/google/callback`.
5. Backend callback owns `GOOGLE_CLIENT_SECRET`, token exchange, userinfo, user linking, and Holiwyn mobile API credential minting.
6. Mobile receives only the Holiwyn API key after callback success.

## Acceptance Criteria

| ID | Priority | Criterion | Evidence | Result |
| --- | --- | --- | --- | --- |
| UV-P0-01 | P0 | A local script can validate Google auth runtime setup without printing Google credentials. | `mobile/scripts/google-auth-runtime-preflight.ps1`; focused test. | Pass |
| UV-P0-02 | P0 | The script checks backend auth base, mobile return URL, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` presence. | Runtime preflight output. | Pass |
| UV-P0-03 | P0 | The script calls `/api/auth/google/start` without following redirects and verifies a Google redirect. | Runtime preflight output. | Pass |
| UV-P0-04 | P0 | The script verifies Google `redirect_uri` matches `NEXTAUTH_URL/api/auth/google/callback`. | Runtime preflight output. | Pass |
| UV-P0-05 | P0 | Package scripts expose non-strict and strict preflight modes. | `mobile/package.json`; focused test. | Pass |
| UV-P1-01 | P1 | Strict physical-device mode passes with a callback URL reachable by the S23 browser. | Requires active S23/manual OAuth setup. | Open |

## API / Data Dependencies

| Mobile feature | Route | Method | Auth | Request/params | Response/return consumed |
| --- | --- | --- | --- | --- | --- |
| Google auth readiness preflight | `/api/auth/google/start` | `GET` | None | `returnTo=/portfolio`, `mobileReturnTo=<configured return URL>` | 3xx Location header to `accounts.google.com` |
| Google callback readiness | `/api/auth/google/callback` | `GET` after Google consent | Google OAuth state/code | Preflight verifies expected `redirect_uri`; it does not complete consent. | Manual proof consumes mobile return link after real consent |

## Proof

- `npm run check:google-auth-runtime`
- `npm run test:mobile-api -- --run mobile/src/__tests__/googleAuthRuntimePreflightContract.test.ts mobile/src/__tests__/googleMobileAuthContract.test.ts`
- `npm run typecheck`

Runtime result:

- Backend auth base configured: pass.
- Mobile return URL configured: pass.
- `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` configured: pass.
- Allowed return scheme: pass.
- Google start route returns 3xx: pass.
- Redirect host is `accounts.google.com`: pass.
- Google `redirect_uri` matches `NEXTAUTH_URL/api/auth/google/callback`: pass.

## Audit Gate

P0 result: Pass for runtime preflight/source scope.

Unresolved P0 gaps: 0 for this scope.

Remaining P1: run `npm run check:google-auth-runtime:strict` and real S23 Google consent proof after the S23 is visible to ADB and `NEXTAUTH_URL` is a callback origin reachable by the S23 browser.

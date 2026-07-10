# Cycle SE - Google Mobile Return Compatibility

## Scope

Keep Holiwyn mobile on the same backend-owned Google Cloud OAuth credential/token flow while making real-device local testing compatible with Expo Go return links.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Google Cloud client IDs, secrets, and Google access tokens stay off mobile. | Pass |
| P0 | Backend continues to use `/api/auth/google/start` and `/api/auth/google/callback` for Google token exchange. | Pass |
| P0 | Production mobile return URLs remain restricted to the Holiwyn app scheme. | Pass |
| P1 | Non-production Expo Go `exp:` / `exps:` return URLs are allowed for manual S23 testing. | Pass |
| P1 | Documentation explains that Google Cloud redirect URI remains the backend callback, not the Expo link. | Pass |
| P1 | Real interactive Google consent on S23 is attempted and recorded. | Open |

## Implementation Notes

- `src/app/api/auth/google/start/route.ts` accepts `holiwyn:` always and `exp:` / `exps:` only when `NODE_ENV !== "production"`.
- `src/app/api/auth/google/callback/route.ts` checks the same allowlist before appending `googleAuth=success` and `apiKey=<redacted>`.
- `mobile/.env.example` and `mobile/README.md` document the Expo Go testing path without introducing mobile Google credentials.

## Backend/API Notes

- No schema change.
- The Google Cloud authorized redirect URI remains the backend callback, for example `http://127.0.0.1:3002/api/auth/google/callback`.
- `EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL` is only the post-callback app return target.

## Proof

- Mobile typecheck: passed.
- Focused auth tests: passed.
- S23 proof: the existing callback-shaped Google return/logout proof remains the device proof for visible mobile behavior; this cycle changes backend return allowlisting only.
- Result: Pass for SE P0 and scoped P1 compatibility. Real manual Google consent remains open.

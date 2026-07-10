# Cycle SF - Google Mobile Return Allowlist Contract

## Scope

Backend Google OAuth mobile return URL safety for the Local MVP auth flow.

## Acceptance Criteria

| Priority | Criterion | Result |
| --- | --- | --- |
| P0 | Auth start and callback use the same mobile return allowlist logic. | Pass |
| P0 | `holiwyn:` return URLs are allowed in production and local modes. | Pass |
| P0 | `exp:` / `exps:` return URLs are allowed only outside production. | Pass |
| P0 | Web, javascript, and malformed return values are rejected. | Pass |
| P0 | Google Cloud credentials and Google access tokens remain server-only. | Pass |
| P1 | Real interactive Google consent on S23 is proven. | Open |

## Implementation Notes

- Added `src/lib/mobileReturnUrl.ts`.
- Updated `/api/auth/google/start` and `/api/auth/google/callback` to call `isAllowedMobileReturnUrl`.
- Added `mobile/src/__tests__/googleMobileReturnAllowlist.test.ts` for direct allowlist behavior.

## Backend/API Notes

- No schema change.
- No new route.
- Existing Google OAuth start/callback route contract remains unchanged except for centralized validation.

## Proof

- Direct allowlist test: passed.
- Focused Google auth tests: passed.
- Mobile typecheck: passed.
- Root TypeScript check: passed.
- S23 visual proof: inherited from Cycle SE because visible mobile behavior is unchanged.

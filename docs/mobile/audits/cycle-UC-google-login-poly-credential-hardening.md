# Cycle UC - Google Login Poly Credential Hardening

Status: passed for source/contract hardening. This cycle keeps Google OAuth logic aligned with the existing Poly/Holiwyn backend implementation and does not change visible Local MVP UI.

## Scope

- Use the same backend Google OAuth start/callback logic as Poly/Holiwyn web.
- Keep Google Cloud `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, Google access tokens, and Google refresh tokens on the backend.
- Make the mobile-return credential naming clearer by adding `holiwynApiKey` while preserving `apiKey` for old proof links.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| UC-GA-P0-01 | P0 | Mobile must continue launching `/api/auth/google/start` on the backend, not a separate Expo Google client flow. | Pass |
| UC-GA-P0-02 | P0 | Backend callback must continue owning Google code exchange, userinfo fetch, user linking/creation, and Holiwyn API credential creation. | Pass |
| UC-GA-P0-03 | P0 | Mobile must store only the backend-minted Holiwyn API credential, not Google access or refresh tokens. | Pass |
| UC-GA-P0-04 | P0 | Callback must provide a clearly named Holiwyn mobile credential parameter while keeping existing proof links compatible. | Pass |
| UC-GA-P1-01 | P1 | Real S23 Google consent proof should be run when the reachable backend callback URL is registered and a test Google account session is available. | Open |

## Implementation Notes

- `src/app/api/auth/google/callback/route.ts` now returns `holiwynApiKey=<Holiwyn API key>` and the existing `apiKey=<Holiwyn API key>` alias.
- `mobile/App.tsx` accepts either `holiwynApiKey` or `apiKey` from the deep link and stores the returned credential through SecureStore.
- `docs/mobile/GOOGLE_LOGIN_SETUP.md` now explicitly states that `holiwynApiKey` is not a Google token.

## Proof

- Focused Google mobile auth contract test passed.
- Mobile typecheck passed.
- No S23 visual proof was required because the visible login UI did not change in this cycle.

## Remaining Gap

- Manual S23 Google consent proof remains P1 and depends on the backend auth host matching the callback URL registered in the same Google Cloud OAuth client.

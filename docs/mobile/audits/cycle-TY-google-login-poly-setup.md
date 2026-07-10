# Cycle TY - Google Login Poly Setup Alignment

## Scope

Align Holiwyn mobile Google login setup with the existing Poly/Holiwyn Google Cloud OAuth credential and backend token-exchange logic.

No visible UI, order flow, provider import, schema, or backend route behavior changed in this cycle.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| TY-P0-01 | P0 | Mobile must use the backend `/api/auth/google/start` route rather than a separate mobile Google client flow. | Pass |
| TY-P0-02 | P0 | Google Cloud `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, Google access tokens, and Google refresh tokens must remain backend-owned. | Pass |
| TY-P0-03 | P0 | Backend callback must keep owning Google code exchange, userinfo fetch, user creation/linking, and Holiwyn mobile API credential creation. | Pass |
| TY-P0-04 | P0 | Setup docs must explain how to reuse the same Poly/Holiwyn Google Cloud credential for mobile. | Pass |
| TY-P1-01 | P1 | Manual S23 Google consent proof should be run when a real browser/account testing window is available. | Open |

## Implementation Notes

- Added `docs/mobile/GOOGLE_LOGIN_SETUP.md`.
- Linked the setup guide from `mobile/README.md`.
- Extended `mobile/src/__tests__/googleMobileAuthContract.test.ts` so docs and code keep the same credential-ownership model.

## Audit Result

Pass for setup/source contract. The remaining P1 is real interactive Google consent on S23, which requires an actual Google account/browser session and a Google Cloud callback URL matching the reachable backend auth host.

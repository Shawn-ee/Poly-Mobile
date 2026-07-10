# Cycle RW - Event Detail Simple Market Page and Google Mobile Auth

## Scope

Local MVP only:

- Event Detail market page: remove visible market chart, keep Game Lines trading path.
- Source/debug labels: keep internal audit metadata, hide retail-facing source noise.
- Google login: use the same backend Google OAuth credential/token flow as the web app.

Out of scope:

- Order book UI.
- Chat, live stats, social, watchlists.
- Deposit/withdraw.
- Backend schema migration.

## Polymarket/User Reference

The current product direction is to simplify Holiwyn's Local MVP retail betting flow instead of reproducing Polymarket's full chart behavior. The user explicitly requested removing the Polymarket chart from the market page because it is too complicated for the current MVP.

## Acceptance Criteria

| Criteria | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Event Detail no longer renders the visible market-page chart. | P0 | Pass | `docs/mobile/screenshots/cycle-RW-event-detail-simple-market-page/cycle-RW-current-mvp-detail-top.png` |
| Event Detail still exposes Game Lines, line selectors, ticket open, swipe buy, Portfolio, cashout/sell, and History. | P0 | Pass | `docs/mobile/harness/cycle-RW-event-detail-simple-market-page/cycle-RW-current-mvp-s23-visible-flow.json` |
| Source/debug labels do not dominate visible tester UI. | P0 | Pass | Source markers moved to hidden/audit-only styling; focused test passed. |
| Google sign-in launches the backend Google OAuth start route, not a mobile-only fake login. | P0 | Pass | `mobile/src/__tests__/googleMobileAuthContract.test.ts` |
| Google Cloud client id/secret remain server-side only. | P0 | Pass | `src/app/api/auth/google/start/route.ts`; `src/app/api/auth/google/callback/route.ts` |
| After Google callback, mobile can receive a Holiwyn API credential for server-mode Portfolio/order routes. | P0 | Pass by route contract | Backend callback creates a `Holiwyn Mobile Google` API credential and returns it through the Holiwyn app deep link. |
| Manual Google account consent completed on S23. | P1 | Pending | Requires interactive Google login proof. |

## Backend/Data Contract

- `/api/auth/google/start`
  - Adds optional `mobileReturnTo`.
  - Accepts only the Holiwyn app scheme by default: `holiwyn://...`.
  - Still uses `GOOGLE_CLIENT_ID` from server env.

- `/api/auth/google/callback`
  - Still exchanges Google code for token using server-side `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
  - Still creates/links the user through the existing Google account logic.
  - For mobile return only, creates an `ApiCredential` with mobile MVP scopes and redirects back to the app with `apiKey`.

- `mobile/App.tsx`
  - Builds Google auth URL from `EXPO_PUBLIC_API_BASE_URL`.
  - Uses `EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL` when set, otherwise defaults to `holiwyn://auth/google`.
  - On `googleAuth=success`, switches to Portfolio and triggers server Portfolio refresh when an API key is present.

## Proof

- Mobile typecheck: passed.
- Root TypeScript check: passed with `npx tsc --noEmit --pretty false`.
- Focused mobile vitest: passed.
- Samsung S23 proof: passed.
- Proof summary: `docs/mobile/harness/cycle-RW-event-detail-simple-market-page/cycle-RW-current-mvp-s23-visible-flow.json`.

## Remaining Gaps

- P1: Real provider-backed current-match Spread/Totals/Team Total markets remain unavailable.
- P1: Manual S23 Google OAuth consent/deep-link proof remains to be run.
- P1: Expo Go may require setting `EXPO_PUBLIC_GOOGLE_AUTH_RETURN_URL` to the active Expo deep link; the default `holiwyn://auth/google` is intended for the real app/dev build.

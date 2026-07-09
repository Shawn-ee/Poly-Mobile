# Cycle QX - Portfolio Proof Launch Reliability

## Scope

Audit-gate harness reliability for the Local MVP Portfolio leg.

The previous QW proof showed that `forceResetState=1&forcePortfolio=1` could load the current Expo bundle but remain on Home until the proof manually tapped Portfolio. That manual tap works, but it weakens repeatability for Portfolio/account/order-history proof.

This cycle fixes the proof path so automated S23 proof can land on Portfolio directly. During proof, Expo Go did not deliver `exp://.../?forcePortfolio=1` query params to React Native `Linking` consistently on cold or warm launch, and the installed `com.holiwyn.mobile` development build could remain foreground with stale UI. The reliable proof path is now:

1. Stop both `host.exp.exponent` and `com.holiwyn.mobile`.
2. Start Expo with `EXPO_PUBLIC_PROOF_INITIAL_TAB=portfolio`.
3. Launch `host.exp.exponent` against the current Metro URL.
4. Capture XML/screenshot from the current Expo Go package.

Normal user behavior remains unchanged because the proof override defaults to Home.

## Acceptance Criteria

| ID | Priority | Criteria | Evidence |
| --- | --- | --- | --- |
| QX-P0-01 | P0 | `forcePortfolio=1` remains protected from the delayed reset wipeout. | Source contract test. |
| QX-P0-02 | P0 | `forceResetState=1&forcePortfolio=1` reapplies Portfolio after reset when Expo Go delivers the launch URL. | Source contract test. |
| QX-P0-03 | P0 | S23 proof opens current Expo Go runtime directly to Portfolio without manual tab tap, using the proof initial-tab fallback when Expo Go drops query params. | S23 XML/screenshot proof. |
| QX-P0-04 | P0 | No backend/order/schema/product UI areas are changed. | Git diff and docs. |
| QX-P0-05 | P0 | Portfolio Google/account entry opens Account and Account still exposes Google login. | S23 XML/screenshot proof. |

## Implementation

- Added a short post-reset `setMainTab("portfolio")` reapply when `shouldForcePortfolio` is present.
- Added proof-only `EXPO_PUBLIC_PROOF_INITIAL_TAB`, defaulting to `home`, so automated proof can start on Portfolio when Expo Go does not forward launch query params.
- Extended the existing deep-link reset contract test.

## Backend/API Contract

- No backend route changed.
- No data contract changed.
- Existing Portfolio routes remain `/api/portfolio`, `/api/portfolio/history`, and `/api/portfolio/value-history` when server mode and API key are used.

## Audit Gate

Pass for QX scope.

Evidence:

- `docs/mobile/harness/cycle-QX-portfolio-deeplink-proof-reliability/cycle-QX-portfolio-proof-launch-reliability-proof.json`
- `docs/mobile/harness/cycle-QX-portfolio-deeplink-proof-reliability/cycle-QX-expo-proof-initial-tab.xml`
- `docs/mobile/screenshots/cycle-QX-portfolio-deeplink-proof-reliability/cycle-QX-expo-proof-initial-tab.png`
- `docs/mobile/harness/cycle-QX-portfolio-deeplink-proof-reliability/cycle-QX-account-google-login.xml`
- `docs/mobile/screenshots/cycle-QX-portfolio-deeplink-proof-reliability/cycle-QX-account-google-login.png`

Validation:

- `npm run typecheck --prefix mobile` passed.
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/deepLinkResetContract.test.ts` passed.
- Samsung S23 proof passed on `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.

## Remaining Gaps

- This does not change native Google OAuth callback/session/logout.
- This does not address provider-backed line-market availability.
- Expo Go launch URL forwarding remains unreliable on this S23 session; proof runs should stop the stale installed Holiwyn dev build and use `EXPO_PUBLIC_PROOF_INITIAL_TAB` when they need a deterministic starting screen.

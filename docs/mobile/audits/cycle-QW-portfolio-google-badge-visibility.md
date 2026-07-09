# Cycle QW - Portfolio Google Badge Visibility

## Scope

Local MVP retail flow account entry clarity after user feedback that Google login looked missing.

This cycle does not change Home, backend auth, order flow, wallet, order book, chat, live stats, or social features.

## Polymarket Reference Behavior

- Polymarket keeps account/profile access away from the main Home market feed.
- The signed-in Portfolio profile header is visually obvious and acts as the account/settings entry.
- Account actions should not crowd the Home page.

## Holiwyn Acceptance Criteria

| ID | Priority | Criteria | Evidence |
| --- | --- | --- | --- |
| QW-P0-01 | P0 | Home remains free of the old account button. | Source/contract check. |
| QW-P0-02 | P0 | Portfolio top-left account entry remains clickable and opens Account. | S23 XML/screenshot proof. |
| QW-P0-03 | P0 | Portfolio makes Google/account entry visibly discoverable without moving it back to Home. | S23 XML/screenshot proof. |
| QW-P0-04 | P0 | Account still exposes `Continue with Google` / Google login action. | S23 XML/screenshot proof. |
| QW-P1-01 | P1 | Full native OAuth callback/session/logout is proven. | Deferred to auth milestone. |

## Implementation

- Added a small Google badge on the Portfolio avatar/account entry.
- Kept the explicit Portfolio Google login button.
- Preserved `openAccount()` routing to the existing Account screen.
- Added a focused source contract assertion for the badge markers.

## Backend/API Contract

- No backend route changed.
- Google sign-in still starts through the existing `/api/auth/google/start?returnTo=%2Fportfolio` browser redirect only after the user taps Google sign-in on Account.

## Audit Gate

Pass for focused Portfolio Google badge visibility scope.

Evidence:

- `docs/mobile/harness/cycle-QW-portfolio-google-badge-visibility/cycle-QW-portfolio-google-badge-visibility-proof.json`
- `docs/mobile/screenshots/cycle-QW-portfolio-google-badge-visibility/cycle-QW-portfolio-google-badge.png`
- `docs/mobile/harness/cycle-QW-portfolio-google-badge-visibility/cycle-QW-portfolio-google-badge.xml`
- `docs/mobile/screenshots/cycle-QW-portfolio-google-badge-visibility/cycle-QW-account-google-login.png`
- `docs/mobile/harness/cycle-QW-portfolio-google-badge-visibility/cycle-QW-account-google-login.xml`

Notes:

- A stale installed APK capture was discarded during proof. The passing Portfolio proof is from Expo Go package `host.exp.exponent` on Samsung S23.

## Remaining Gaps

- Native Google OAuth callback/session/logout remains P1.

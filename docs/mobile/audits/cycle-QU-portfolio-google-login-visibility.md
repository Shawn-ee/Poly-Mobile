# Cycle QU - Portfolio Google Login Visibility

Date: 2026-07-09

## Scope

Local MVP visible user flow:

Portfolio -> Account login entry -> Account screen.

This cycle responds to the tester concern that Google login appeared to disappear after the Home cleanup. Home stays focused on World Cup/Matches/Live, while Portfolio makes the Account/Google login entry more explicit.

Out of scope:

- Native OAuth callback/session/logout.
- Moving account/login back to Home.
- Deposit, withdraw, order book, chat, live stats, social, backend schema, or order routes.

## Reference Behavior

Polymarket keeps account/profile entry near the Portfolio/account surface rather than inside the sports match feed. Holiwyn should keep Home clean, but the Portfolio header must make account/login entry obvious enough for manual testers.

## Acceptance Criteria

### P0

- Portfolio header visibly exposes an account/login entry.
- Portfolio header visibly includes Google login wording.
- Tapping the Portfolio Google/login entry opens the Account screen.
- Account screen still exposes the Google login action.
- Home remains free of account/login controls.
- No backend route, schema, order, Portfolio data, order book, chat, live stats, social, deposit, or withdraw work changes.

### P1

- English and Chinese Portfolio copy both clearly mention Google login.
- Accessibility/test markers identify the Portfolio top-left account entry and Google login button.

### P2

- Native Google OAuth callback/session/logout can be implemented in a later auth milestone.

## Implementation

- `mobile/src/components/Portfolio.tsx`
  - Changed Portfolio header copy from generic account/login wording to explicit Google login wording.
  - Shortened the right-side Google action copy so it fits better on Samsung S23.
  - Added explicit accessibility markers for visible Google login label/button state.
- `mobile/src/__tests__/portfolioSettingsContract.test.ts`
  - Updated the source contract guard for the clearer Portfolio Google login entry.

## Audit Result

Pass on Samsung S23.

Evidence:

- `docs/mobile/harness/cycle-QU-portfolio-google-login-visibility/cycle-QU-portfolio-google-login-visibility-proof.json`
- `docs/mobile/screenshots/cycle-QU-portfolio-google-login-visibility/cycle-QU-portfolio-google-login-visible.png`
- `docs/mobile/harness/cycle-QU-portfolio-google-login-visibility/cycle-QU-portfolio-google-login-visible.xml`
- `docs/mobile/screenshots/cycle-QU-portfolio-google-login-visibility/cycle-QU-account-google-login-screen.png`
- `docs/mobile/harness/cycle-QU-portfolio-google-login-visibility/cycle-QU-account-google-login-screen.xml`

Checked:

- Portfolio opened on `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM-S911U1`.
- Portfolio showed the explicit Google login copy and account-entry markers.
- Tapping the Portfolio Google login entry opened Account.
- Account showed the Google login action.
- Expo developer menu was absent from proof XML.

Unresolved P0 gaps for this focused scope: 0.

## Remaining Gaps

- Native Google OAuth callback/session/logout remains separate auth work.

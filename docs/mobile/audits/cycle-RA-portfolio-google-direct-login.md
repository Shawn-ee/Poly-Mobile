# Cycle RA - Portfolio Google Direct Login

## Scope

Local MVP account-entry cleanup for the Portfolio header.

The Google login function still existed, but the visible `Google login` chip in Portfolio only opened the Account screen. That made the login action feel indirect and easy to miss after the Home account button was intentionally removed. This cycle keeps the top-left avatar/profile as the Account entry and makes the separate `Google login` chip launch the existing Google auth URL directly.

This cycle does not change backend routes, OAuth provider logic, session storage, order logic, Event Detail, Trade Ticket, order book, chat, live stats, social, deposit, or withdraw behavior.

## Acceptance Criteria

| ID | Priority | Criteria | Evidence |
| --- | --- | --- | --- |
| RA-P0-01 | P0 | Portfolio top-left profile/avatar still opens Account. | Source contract and S23 XML marker. |
| RA-P0-02 | P0 | Portfolio `Google login` chip is visible and no longer acts only as an Account-navigation alias. | Source contract and S23 XML marker. |
| RA-P0-03 | P0 | Tapping the Portfolio `Google login` chip launches the existing Google auth/browser flow without entering credentials. | S23 after-tap XML/screenshot shows Chrome/auth surface. |
| RA-P0-04 | P0 | Account screen still exposes the existing `Continue with Google` button. | Focused Account auth contract test. |
| RA-P0-05 | P0 | No backend route, schema, order, ticket, order book, chat, live stats, social, deposit, or withdraw code changes. | Git diff and docs. |

## Implementation

- Added `openGoogleSignIn` as an explicit `Portfolio` prop.
- Wired the Portfolio `Google login` chip to `openGoogleSignIn`.
- Kept the Portfolio top-left avatar/profile `openAccount` behavior unchanged.
- Added a hidden proof marker `portfolio-account-google-direct-signin` to the Google chip accessibility label.

## Backend/API Contract

- No backend route changed.
- The Portfolio chip now uses the existing mobile auth launcher:
  - `GET /api/auth/google/start?returnTo=%2Fportfolio`
- The browser/auth route remains server-owned.
- Native OAuth callback/session/logout proof remains future P1 work.

## Audit Gate

Pass.

- Typecheck passed.
- Focused Portfolio/Account auth contract tests passed.
- S23 proof device: Samsung S23 `SM-S911U1`, `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Portfolio proof showed `portfolio-screen`, `portfolio-account-entry-google`, `portfolio-account-google-direct-signin`, and `portfolio-account-entry-top-left`.
- After tapping the Google chip, the active package changed from Expo Go to Chrome/auth surface.

Evidence:

- Portfolio XML: `docs/mobile/harness/cycle-RA-portfolio-google-direct-login/cycle-RA-portfolio.xml`
- Portfolio screenshot: `docs/mobile/screenshots/cycle-RA-portfolio-google-direct-login/cycle-RA-portfolio.png`
- After-tap XML: `docs/mobile/harness/cycle-RA-portfolio-google-direct-login/cycle-RA-after-google-tap.xml`
- After-tap screenshot: `docs/mobile/screenshots/cycle-RA-portfolio-google-direct-login/cycle-RA-after-google-tap.png`

## Remaining Gaps

- Full native Google OAuth callback/session/logout proof remains P1.

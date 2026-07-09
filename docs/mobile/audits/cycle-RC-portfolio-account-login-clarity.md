# Cycle RC - Portfolio Account Login Clarity

## Scope

Local MVP Portfolio account/login discoverability after Home account controls were intentionally removed.

This cycle does not change backend routes, OAuth provider logic, session storage, order logic, Event Detail, Trade Ticket, order book, chat, live stats, social, deposit, or withdraw behavior.

## Acceptance Criteria

| ID | Priority | Criteria | Evidence |
| --- | --- | --- | --- |
| RC-P0-01 | P0 | Home remains account-clean; Portfolio owns account/login entry. | Source review; no Home code changed. |
| RC-P0-02 | P0 | Portfolio top-left avatar/name remains clickable and opens Account. | Source contract and S23 XML marker `portfolio-account-entry-top-left`. |
| RC-P0-03 | P0 | Portfolio exposes a familiar settings gear entry that opens Account/settings. | Source contract and S23 XML marker `portfolio-account-settings-gear`. |
| RC-P0-04 | P0 | Portfolio shows a clear full-width `Google login` row. | S23 XML marker `portfolio-google-login-row-visible` and screenshot. |
| RC-P0-05 | P0 | Pressing `Google login` launches the existing browser auth flow. | S23 after-tap focus shows Chrome. |
| RC-P0-06 | P0 | No backend, order, ticket, order book, chat, live stats, social, deposit, or withdraw code changed. | Git diff. |

## Implementation

- Reworked the Portfolio header into a Polymarket-like profile row with a top-right settings gear.
- Kept the top-left avatar/name as the Account entry.
- Moved the direct Google sign-in affordance into a full-width row below the profile header.
- Preserved the existing `openGoogleSignIn()` behavior.

## Backend/API Contract

- No backend route changed.
- The visible Portfolio Google row still opens:
  - `GET /api/auth/google/start?returnTo=/portfolio`
- The browser/auth route remains server-owned.
- Demo fake-token trading still works without sign-in.

## Audit Gate

Pass for the focused Portfolio account/login discoverability scope.

- Typecheck passed.
- Focused mobile contract tests passed with `vitest.mobile.config.mts`.
- S23 proof device: Samsung S23 `SM-S911U1`, `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Portfolio proof shows `portfolio-profile-header`, `portfolio-account-entry-top-left`, `portfolio-account-settings-gear`, and `portfolio-account-entry-google`.
- After tapping the `Google login` row, Android focus changed to `com.android.chrome/org.chromium.chrome.browser.ChromeTabbedActivity`.

Evidence:

- Portfolio screenshot: `docs/mobile/screenshots/cycle-RC-portfolio-account-login-clarity/cycle-RC-portfolio-account-login-clarity.png`
- Portfolio XML: `docs/mobile/harness/cycle-RC-portfolio-account-login-clarity/cycle-RC-portfolio-account-login-clarity.xml`
- After-tap screenshot: `docs/mobile/screenshots/cycle-RC-portfolio-account-login-clarity/cycle-RC-after-google-login-tap.png`
- After-tap XML: `docs/mobile/harness/cycle-RC-portfolio-account-login-clarity/cycle-RC-after-google-login-tap.xml`

## Remaining Gaps

- Full native Google OAuth callback/session/logout proof remains P1.
- Portfolio position/open-order deeper parity remains a separate MVP user-flow milestone.

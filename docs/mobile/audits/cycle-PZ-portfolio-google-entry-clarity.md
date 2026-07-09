# Cycle PZ - Portfolio Google Entry Clarity

Status: P0 pass.

Scope:

- Local MVP Account/Portfolio entry discoverability.
- No Home account shortcut restoration.
- No auth route, backend schema, wallet, order, provider, orderbook, chat, live stats, social, deposit, or withdrawal work.

Reference observation:

- The Local MVP direction moved account entry out of Home and into Portfolio.
- User feedback showed the Google login path was too easy to miss after that cleanup.

Holiwyn acceptance criteria:

| Priority | Criterion | Evidence |
| --- | --- | --- |
| P0 | Portfolio must expose an obvious account/login affordance without restoring the Home account button. | S23 screenshot/XML of Portfolio header. |
| P0 | The visible Portfolio affordance must route to Account through the existing `openAccount` path. | XML/proof showing Account after tapping the Portfolio entry. |
| P0 | Account must still show `Continue with Google` through `account-login-google`. | S23 screenshot/XML of Account. |
| P0 | No backend/auth route or order logic changes are introduced. | Git diff and backend route dependency map. |
| P1 | End-to-end Google OAuth callback/session hydration should be proven later. | Future auth cycle. |

Implementation notes:

- Added an `Account` cue under the Portfolio profile name.
- Replaced the subtle gear-only account entry with a compact `Google sign-in` chip that routes to Account.
- Kept the Account screen Google button and `openGoogleSignIn` route unchanged.

Audit Gate:

- Pass.
- S23 proof confirms Portfolio shows `Account` plus `Google sign-in`, tapping the chip opens Account, Account shows `Continue with Google`, and the bottom navigation does not expose an Account tab.
- Evidence:
  - `docs/mobile/harness/cycle-PZ-portfolio-google-entry-clarity/cycle-PZ-s23-proof-summary.json`
  - `docs/mobile/screenshots/cycle-PZ-portfolio-google-entry-clarity/cycle-PZ-s23-portfolio-google-entry.png`
  - `docs/mobile/screenshots/cycle-PZ-portfolio-google-entry-clarity/cycle-PZ-s23-account-google-login.png`
  - `docs/mobile/harness/cycle-PZ-portfolio-google-entry-clarity/cycle-PZ-s23-portfolio.xml`
  - `docs/mobile/harness/cycle-PZ-portfolio-google-entry-clarity/cycle-PZ-s23-account.xml`

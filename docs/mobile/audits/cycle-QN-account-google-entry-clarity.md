# Cycle QN - Account Google Entry Clarity

## Scope

Focused Local MVP account-entry clarity after tester feedback that Google login looked like it disappeared.

This cycle does not change backend auth routes, OAuth logic, profile/session state, deposits, withdrawals, order routes, orderbook UI, chat, live stats, social features, or schemas.

## Reference Finding

Holiwyn intentionally removed the old Home top-right account button during Home cleanup. The supported path is now Portfolio -> Account. The Google sign-in function still existed, but the Portfolio entry and Account connected/signed-out states were too easy to misread.

## Acceptance Criteria

P0:

- Portfolio must visibly expose the Account/Login entry point.
- Portfolio must make the Google account entry discoverable without bringing back Home account clutter.
- Account must show a clearly labeled Google account section.
- Signed-out Account must still expose the `Continue with Google` button.
- Internal markers must prove the same UI path: Portfolio account entry marker, Google account card, and signed-out Google status marker.
- No backend auth/order/schema work may change in this cycle.

P1:

- Full native Google OAuth callback/session/logout proof remains future work.
- Connected-state Account proof should stay in regression coverage.

P2:

- Later account styling can move closer to the final Polymarket profile/account page after the Local MVP trading flow is stable.

## Implementation

- Portfolio copy now labels the profile entry as `Account & login`.
- Portfolio Google entry now says `Google account`.
- Account now has a persistent `Google account` section title and explicit status chip:
  - `Sign in` when signed out.
  - `Connected` when profile state is loaded.
- Existing `openGoogleSignIn()` and `/api/auth/google/start?returnTo=/portfolio` behavior remains unchanged.

## Evidence

- S23 proof summary: `docs/mobile/harness/cycle-QN-account-google-entry-clarity/cycle-QN-account-google-entry-clarity-proof.json`
- Portfolio proof XML: `docs/mobile/harness/cycle-QN-account-google-entry-clarity/cycle-QN-portfolio-account-entry.xml`
- Portfolio screenshot: `docs/mobile/screenshots/cycle-QN-account-google-entry-clarity/cycle-QN-portfolio-account-entry.png`
- Account proof XML: `docs/mobile/harness/cycle-QN-account-google-entry-clarity/cycle-current-holiwyn-account.xml`
- Account screenshot: `docs/mobile/screenshots/cycle-QN-account-google-entry-clarity/cycle-current-holiwyn-account.png`

## Audit Gate

Pass for focused QN scope.

The Samsung S23 proof confirms:

- Portfolio shows `Account & login`.
- Portfolio shows `Google account`.
- Portfolio XML contains `portfolio-account-entry-google`.
- Account shows `Google account`.
- Account shows `Continue with Google`.
- Account XML contains `account-login-google-status-signed-out`.

Remaining P1:

- Full Google OAuth browser callback/session/logout proof is still outside this focused UI clarity cycle.

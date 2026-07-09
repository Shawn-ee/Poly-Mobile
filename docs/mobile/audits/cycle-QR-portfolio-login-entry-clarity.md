# Cycle QR - Portfolio Login Entry Clarity

Date: 2026-07-09

## Scope

Local MVP visible user flow:

Portfolio -> Account/login entry -> Account screen -> Google sign-in entry.

This cycle responds to tester feedback that the Google login function appeared to disappear after the Home cleanup. The auth function was still present, but the visible entry moved to Portfolio and was too easy to miss.

Out of scope:

- Backend auth implementation changes.
- Native OAuth callback/session/logout.
- Order book, chat, live stats, social, watchlist, deposit, or withdraw.

## Reference Behavior

Polymarket places account/profile access in the Portfolio/profile area and keeps it visually obvious. Holiwyn should keep account/login out of Home for the MVP cleanup, but Portfolio must clearly advertise the account/login path.

## Acceptance Criteria

### P0

- Portfolio top header has a visible account/login entry.
- Portfolio header has a Google sign-in entry with action-oriented copy, not a vague account label.
- Tapping either Portfolio account entry opens the Account screen.
- Account screen still renders the Google sign-in/connect area.
- No backend order/auth routes are changed in this visual clarity cycle.

### P1

- Chinese mode uses action-oriented Google login copy.
- Header remains compact and does not overlap Portfolio value/chart content on Samsung S23.

### P2

- Future native auth callback/session/logout can reuse the same Account screen entry.

## Implementation

- `mobile/src/components/Portfolio.tsx`
  - Changed English Portfolio header button copy from `Google account` to `Sign in with Google`.
  - Changed Chinese Portfolio header button copy to `\u4f7f\u7528 Google \u767b\u5f55`.
  - Widened the Portfolio Google entry button and made the account/login label slightly more visible.
- `mobile/src/__tests__/portfolioSettingsContract.test.ts`
  - Added a source contract guard so the clearer Google login copy remains visible.

## Audit Result

Pass for QR scope.

Samsung S23 proof confirmed:

- Portfolio top-left account entry is present and tappable.
- Portfolio Google entry is present and uses action-oriented login copy.
- Account screen is reachable.
- Account screen renders the Google login/connect area.
- No developer menu overlay was present.

Evidence:

- `docs/mobile/harness/cycle-QR-portfolio-login-entry-clarity/cycle-QR-portfolio-login-entry-clarity-proof.json`
- `docs/mobile/harness/cycle-QR-portfolio-login-entry-clarity/cycle-QR-portfolio.xml`
- `docs/mobile/harness/cycle-QR-portfolio-login-entry-clarity/cycle-QR-account.xml`
- `docs/mobile/screenshots/cycle-QR-portfolio-login-entry-clarity/cycle-QR-portfolio-login-entry.png`
- `docs/mobile/screenshots/cycle-QR-portfolio-login-entry-clarity/cycle-QR-account-google-login.png`

## Remaining Gaps

- Native Google OAuth callback/session persistence remains separate auth work.
- This cycle does not validate server-side OAuth credentials or browser redirect success.

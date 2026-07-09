# Cycle PP - Mobile Google Account Entry

Status: P0 pass for focused mobile Google account-entry scope.

## Scope

Restore a visible mobile Google sign-in entry from the Portfolio account flow without touching deposits, withdrawals, location checks, order book UI, chat, live stats, or backend schema.

## Reference Audit

Polymarket signed-in/mobile account access is reachable through account/profile surfaces rather than Home top-right MVP controls. Earlier Holiwyn Local MVP cleanup moved account entry into Portfolio, but the Account screen still showed login/signup as unavailable, making the Google entry look removed.

## Acceptance Criteria

| ID | Priority | Criterion | Evidence |
| --- | --- | --- | --- |
| PP-P0-01 | P0 | Portfolio top-left account entry still opens Account. | Existing `portfolio-account-entry-opens-account` contract and S23 proof. |
| PP-P0-02 | P0 | Signed-out Account shows a visible `Continue with Google` action. | Mobile source/test and S23 screenshot/XML. |
| PP-P0-03 | P0 | Google action opens the configured backend `/api/auth/google/start` route, not a local mock login. | Mobile source/test and manual/S23 proof. |
| PP-P0-04 | P0 | Phone/email mock login and local fake auth state remain absent. | `accountAuthContract` test. |
| PP-P0-05 | P0 | Deposits, withdrawals, and real-money eligibility/location checks remain out of scope. | Account copy/docs. |

## Implementation Notes

- `AccountScreen` renders `account-login-google` for signed-out users.
- `mobile/App.tsx` builds the backend auth URL from `EXPO_PUBLIC_API_BASE_URL`.
- React Native `Linking.openURL` hands off to the system browser.
- No backend route/schema source changed.

## Backend/API Dependency

- `GET /api/auth/google/start?returnTo=%2Fportfolio`
- Browser redirect response; mobile currently does not consume JSON.
- Existing backend auth service owns Google OAuth and session creation.

## Data Contract Gaps

- Native deep-link callback/session exchange is still missing.
- Canceled/misconfigured OAuth states need a future user-visible mobile error state.

## Audit Gate

Passed on Samsung S23:

- Mobile typecheck passed.
- Focused account auth and Portfolio account-entry contract tests passed.
- Samsung S23 account proof passed on `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / `SM-S911U1`.
- First-view screenshot: `docs/mobile/screenshots/cycle-current-holiwyn-smoke.png`.
- Scrolled Preferences screenshot: `docs/mobile/screenshots/cycle-current-holiwyn-account-preferences.png`.
- Account XML proof: `docs/mobile/harness/cycle-current-holiwyn-home.xml`.
- Preferences XML proof: `docs/mobile/harness/cycle-current-holiwyn-account-preferences.xml`.

Unresolved P0 gaps: 0 for this focused entry-point scope.

Remaining P1/P2 gaps:

- P1: complete native callback/session exchange after browser OAuth.
- P1: add explicit canceled/misconfigured OAuth mobile error states.

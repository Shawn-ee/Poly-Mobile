# Cycle RX - Google Auth Return Connected State

## Scope

Local MVP account/login continuity after the backend Google OAuth callback returns a Holiwyn mobile API credential.

Out of scope:

- Interactive Google account consent.
- Logout/token revocation.
- Deposit/withdraw.
- Order book, chat, live stats, social features.

## Acceptance Criteria

| Criteria | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Portfolio no longer looks signed out after a successful auth-return deep link. | P0 | Pass | `docs/mobile/screenshots/cycle-RX-google-auth-return/cycle-RX-google-auth-return-portfolio.png` |
| Connected state survives a proof/reset launch URL. | P0 | Pass | `mobile/App.tsx`; S23 proof summary |
| Returned mobile key can read server Portfolio route. | P0 | Pass | `scripts/prove_mobile_google_auth_return_s23.ps1`; proof summary |
| The visible state is not shown for every server API key by default. | P0 | Pass | App uses explicit `googleAuth=success` state, not just any API key. |
| Real Google consent is completed on S23. | P1 | Open | Requires manual/browser Google account interaction. |

## Implementation Notes

- `mobile/App.tsx`
  - Adds `googleAuthReturnConnected`.
  - Applies `googleAuth=success` after `forceResetState` so reset does not clear the connected state.
  - Passes `googleAuthConnected` into Portfolio.

- `mobile/src/components/Portfolio.tsx`
  - Shows `Google connected` and `Server profile loaded` after the auth-return state.
  - Keeps the normal `Continue with Google` button when no auth-return state exists.

- `scripts/prove_mobile_google_auth_return_s23.ps1`
  - Creates a local mobile dev credential.
  - Verifies `/api/portfolio` accepts the returned key.
  - Starts a temporary Expo server, launches the S23 deep link, captures XML/screenshot, and cleans up Expo.

## Proof

- Mobile typecheck: pass.
- Focused mobile tests: pass.
- S23 proof: pass.
- Summary: `docs/mobile/harness/cycle-RX-google-auth-return/cycle-RX-google-auth-return-summary.json`.

## Remaining Gaps

- P1: complete real Google consent on S23/dev build.
- P1: add logout/token revocation UX and route support.

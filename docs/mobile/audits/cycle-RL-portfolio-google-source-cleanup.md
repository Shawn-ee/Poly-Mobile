# Cycle RL - Portfolio Google Entry and Source Summary Cleanup

## Scope

Local MVP Portfolio header after a server-backed fake-token order. This cycle addresses the tester concern that Google login felt missing after Home account controls were removed.

## Reference Criteria

P0:

- Portfolio must expose a clear account/Google entry without restoring the Home account button.
- The Portfolio Google entry must be visible on Samsung S23.
- Internal source labels must remain available for audit, but debug/source labels must not dominate the visible tester UI.
- Home -> Event Detail -> line market -> Trade Ticket -> fake-token order -> Portfolio/history must still pass on Android.

P1:

- Native Google OAuth callback/session/logout should replace browser-only redirect in a later auth milestone.
- Real provider-backed line-market breadth should replace current contract-fixture line rows when available.

## Implementation

- `Portfolio.tsx` now renders a full-width `Continue with Google` row with helper text under the profile header.
- The top-left profile row remains the Account entry.
- The Portfolio source summary remains in accessibility/XML metadata but is visually hidden.
- `smoke.ps1` nudges Team Total rows upward before tapping during current-route proof, preventing S23 bottom-edge clipping from sending taps to the wrong place.

## Android Proof

Device:

- Samsung S23 / `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / model `SM_S911U1`

Evidence:

- `docs/mobile/harness/cycle-RL-portfolio-google-source-cleanup/cycle-RL-local-mvp-current-route-server-filled-flow-proof.json`
- `docs/mobile/screenshots/cycle-RL-portfolio-google-source-cleanup/cycle-RL-holiwyn-route-server-mvp-portfolio-top.png`
- `docs/mobile/harness/cycle-RL-portfolio-google-source-cleanup/cycle-RL-holiwyn-route-server-mvp-portfolio-top.xml`
- `docs/mobile/screenshots/cycle-RL-portfolio-google-source-cleanup/cycle-RL-holiwyn-route-server-mvp-portfolio-history.png`

## Audit Gate

Result: Pass for RL scope.

Unresolved P0: 0.

Remaining P1:

- Native Google OAuth callback/session/logout.
- Real provider-backed current-match Spread/Totals/Team Total line markets.

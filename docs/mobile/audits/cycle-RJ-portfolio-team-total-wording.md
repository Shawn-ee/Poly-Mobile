# Cycle RJ - Portfolio Team Total Wording Cleanup

## Scope

Local MVP visible cleanup for the Portfolio/history part of:

Home -> Event Detail -> Team Total line -> simple Trade Ticket -> fake-token/server buy -> Portfolio/history.

Out of scope:

- Order book UI
- Chat
- Live stats
- Backend schema or route changes
- Provider line-market breadth

## Acceptance Criteria

P0:

- A current-route Team Total filled order still reaches Portfolio/history on Samsung S23.
- History uses a readable selected-outcome label such as `Argentina Over 1.5 goals`.
- The old awkward label `Team Total Goals team goals` is not required by the proof path.
- Source/identity fields remain present in the Android XML: market id, outcome id, line, period, reference source, and provider token.
- Orders remains empty after the full fill.

P1:

- Real provider-backed line markets should replace current contract fixtures when available.

P2:

- Native Google OAuth callback/session/logout remains separate auth work.

## Implementation Notes

- `Portfolio.tsx` now formats Team Total positions/history from `selection.referenceOutcomeLabel`/outcome identity instead of appending `team goals` to the generic display label.
- The current-route proof wrapper and smoke path now accept a cycle label for clean evidence naming.

## Audit Gate Result

Pass.

Device:
Samsung S23 / `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp` / `SM_S911U1`.

Proof:
`docs/mobile/harness/cycle-RJ-portfolio-team-total-wording/cycle-RJ-local-mvp-current-route-server-filled-flow-proof.json`

Key evidence:

- `docs/mobile/harness/cycle-RJ-portfolio-team-total-wording/cycle-RJ-holiwyn-route-server-mvp-portfolio-history.xml`
- `docs/mobile/screenshots/cycle-RJ-portfolio-team-total-wording/cycle-RJ-holiwyn-route-server-mvp-portfolio-history.png`

## Remaining Gaps

P0:

- None for RJ scope.

P1:

- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.

P2:

- Native Google OAuth callback/session/logout.

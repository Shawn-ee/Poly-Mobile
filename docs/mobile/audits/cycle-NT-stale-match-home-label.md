# Cycle NT - Stale Match Home Label

## Scope

Visible Local MVP status honesty on Home after Cycle NS.

Problem:

- Backend Live route no longer returns stale provider-dated matches.
- Mobile Home still needed to avoid labeling the same stale match as live.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| NT-P0-01 | P0 | Mobile adapter does not mark stale provider-dated events as `live`. | Pass |
| NT-P0-02 | P0 | Home card shows the MVP match without Live context. | Pass |
| NT-P0-03 | P0 | Live tab still shows the no-live empty state. | Pass |
| NT-P0-04 | P0 | Samsung S23 proof exists. | Pass |

## Evidence

- `docs/mobile/harness/cycle-NT-stale-match-home-label/cycle-NT-current-mvp-s23-visible-flow.json`
- `docs/mobile/screenshots/cycle-NT-stale-match-home-label/cycle-NT-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-NT-stale-match-home-label/cycle-NT-current-mvp-live.png`

## Result

Pass.

The app now keeps the stale MVP match available for local fake-token testing while no longer presenting it as a live game.

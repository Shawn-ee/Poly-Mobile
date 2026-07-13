# Cycle ZR - Live Provider Secret Preflight

## Scope

Improve the live-provider refresh operator path without spending provider quota and without committing or printing provider secrets.

## Acceptance Criteria

| ID | Priority | Criterion | Proof |
| --- | --- | --- | --- |
| ZR-P0-01 | P0 | A local preflight command checks for a provider key source without calling The Odds API. | `npm run mobile:one-event-live-runtime:provider-secret-preflight` |
| ZR-P0-02 | P0 | The key can be sourced from process env or ignored `.runtime/secrets/the-odds-api-key.txt`. | script source and `.gitignore` |
| ZR-P0-03 | P0 | The key is never printed, committed, or passed on the command line. | contract test and secret scan |
| ZR-P0-04 | P0 | Refresh mode still delegates to the existing quota-capped one-event live provider proof. | script source |
| ZR-P1-01 | P1 | If no key source is present, mobile-visible provider snapshots remain stale and live refresh is not run. | redacted preflight summary |

## Proof Summary

- Added `scripts/run_holiwyn_one_event_live_runtime_with_secret.ps1`.
- Redacted preflight summary path: `docs/mobile/harness/odds-api-live-runtime/live-provider-key-preflight.redacted.json`.
- Added aliases:
  - `mobile:one-event-live-runtime:provider-secret-preflight`
  - `mobile:one-event-live-runtime:provider-secret`
- `.runtime/` is already ignored by git, so `.runtime/secrets/the-odds-api-key.txt` is not tracked.
- This cycle does not call The Odds API. It only makes the explicit refresh path safer for the next live-refresh run.

# Odds Provider Refresh Policy

## Scope

Temporary Local MVP provider: The Odds API. This policy is for fake-token local testing only.

## Rules

- Refresh exactly one event unless the owner explicitly approves a broader scan.
- Prefer replay fixtures for ordinary readiness checks.
- Use live Odds API calls only for a live-runtime proof or a manually approved refresh.
- `npm run mobile:one-event-live-runtime` is a cached runtime check and does not spend provider quota.
- `npm run mobile:one-event-live-runtime -- -SeedMaker` seeds local fake-token maker liquidity from stored provider snapshots and does not spend provider quota.
- `npm run mobile:one-event-live-runtime:provider` is the explicit live provider proof command and requires `THE_ODDS_API_KEY`.
- Do not print or commit `THE_ODDS_API_KEY`.
- Track provider quota from response headers:
  - `x-requests-used`
  - `x-requests-remaining`
  - `x-requests-last`
- Stop if the configured live proof budget is exceeded.
- Stop if remaining quota falls below the configured floor.

## Default Local Live Proof Settings

| Setting | Default |
| --- | --- |
| Event count | 1 |
| Refresh iterations | 2 |
| Refresh interval | 15 seconds |
| Stale threshold used by route | 90 seconds |
| Refresh-due threshold used by route | 60 seconds |
| Max live provider credits | 16 |
| Min remaining credits | 2 |

## Stale Handling

The mobile event detail route classifies provider quote snapshots as:

- `ready`: snapshot is fresh and not refresh-due.
- `refresh_due`: snapshot is fresh enough to display but should be refreshed soon.
- `stale`: snapshot is older than the stale threshold.
- `unavailable`: no snapshot exists.

The live proof intentionally forces the selected market's existing quote snapshots stale before a refresh, then proves the route returns to `ready` after a live provider refresh.

## Failure Handling

If the provider fails, quota is low, or no upcoming event has supported markets:

- Do not fabricate live provider data.
- Keep replay/local fixture proof separate from live proof.
- Mark live provider runtime as not ready.
- Keep existing Local MVP fake-token replay environment available.

## Latest Live Refresh Proof

- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Quota-free runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`
- Result: pass.
- Event: Spain vs. France, `soccer_fifa_world_cup`, `2026-07-14T19:00:00Z`.
- Provider calls: one sports scan, quota-free event scans, one event-markets call, and two event-odds refreshes.
- Quota used by provider headers: 13 credits, under the 16-credit cap.
- Latest remaining quota at proof time: 459.
- Stale handling proof: selected market quote lifecycle changed from stale before refresh to ready after refresh.

# Odds Provider Refresh Policy

## Scope

Temporary Local MVP provider: The Odds API. This policy is for fake-token local testing only.

## Rules

- Refresh exactly one event unless the owner explicitly approves a broader scan.
- Prefer replay fixtures for ordinary readiness checks.
- Use live Odds API calls only for a live-runtime proof or a manually approved refresh.
- `npm run mobile:one-event-live-runtime` is a cached runtime check and does not spend provider quota.
- `npm run mobile:one-event-live-runtime -- -SeedMaker` seeds local fake-token maker liquidity from stored provider snapshots and does not spend provider quota.
- `npm run mobile:one-event-onboarding` is the default one-command local onboarding path. It uses quota-free replay only when the replay fixture is not older than the current live-runtime target; otherwise it skips replay, restores the latest cached live-runtime event from `one-event-live-runtime-summary.redacted.json`, runs readiness/runtime/settlement checks, and does not spend provider quota.
- `npm run mobile:one-event-onboarding -- -AllowPastReplay` intentionally allows an older redacted replay fixture to overwrite the reusable local one-event slug. Do not use this for internal tester launch unless testing historical replay behavior.
- `npm run mobile:one-event-onboarding -- -RunProviderRefresh` is the explicit one-command path that may spend quota. It requires `THE_ODDS_API_KEY` in the local process environment.
- `npm run mobile:one-event-live-runtime:provider` is the explicit live provider proof command and requires `THE_ODDS_API_KEY`.
- `npm run mobile:one-event-live-supervisor` repeats data hygiene, the local one-event runtime check, maker seed, and safe real-time lifecycle scheduler without spending provider quota unless `-RunProviderProof` is passed.
- `npm run mobile:one-event-live-supervisor -- -RunStaleGuard` also runs the stale-provider guard in dry-run monitor mode each cycle. It reports markets that would pause without mutating the tester runtime.
- `npm run mobile:one-event-live-supervisor -- -RunStaleGuard -EnforceStaleGuard` pauses stale `LIVE` markets while the supervisor runs. Use this only after a fresh live provider refresh or when intentionally testing stale-data trade blocking.
- `npm run mobile:one-event-live-supervisor -- -RunResultSettlement` runs trusted-result settlement scheduling in dry-run mode while the supervisor runs.
- `npm run mobile:one-event-live-supervisor -- -RunProviderProof -Continuous -MaxIterations 0` is the local live-provider supervisor mode. It is quota-capped by `-MaxProviderProofRuns` and paced by `-ProviderProofEveryIterations`; use it only for an intentional manual test.
- `npm run mobile:one-event-live-supervisor:continuous-proof` starts the supervisor in continuous cached mode, proves at least one heartbeat cycle while the process remains alive, checks runtime status, and stops it. It does not spend provider quota.
- `npm run mobile:one-event-runtime-status` reads local proof summaries plus local backend health/quote routes and reports whether the current runtime is cached-only, how fresh the last live proof is, and what quota the last proof used. It does not call the provider.
- `npm run mobile:one-event-result-settlement-run` reads trusted result JSON and invokes the guarded trusted-result settlement path in dry-run mode by default. It does not call the odds provider and does not execute settlement unless explicit execution flags and confirmation are supplied.
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
| Supervisor default iterations | 2 |
| Supervisor provider proof cadence | Every 1 iteration when `-RunProviderProof` is set |
| Supervisor max provider proof runs | 1 by default |
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

The stale-guard proof intentionally forces the selected market's stored provider snapshots stale, pauses the `LIVE` market with `settlementStatus=paused_provider_stale`, verifies `POST /api/orders` rejects with `MARKET_UNAVAILABLE`, then restores the original market and snapshot timestamps. This proof is local and quota-free.

The supervisor stale guard has two modes:

- Dry-run monitor: reports `would_pause` counts and keeps internal tester trading available.
- Enforce pause: mutates stale `LIVE` markets to `PAUSED`.

This distinction is intentional. Cached internal testing can use stored proof snapshots for fake-token trading, while live-provider runtime should enforce the 90-second stale threshold only when provider refresh is actively keeping snapshots fresh.

## Failure Handling

If the provider fails, quota is low, or no upcoming event has supported markets:

- Do not fabricate live provider data.
- Keep replay/local fixture proof separate from live proof.
- Mark live provider runtime as not ready.
- Keep existing Local MVP fake-token replay environment available.

## Latest Live Refresh Proof

- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Quota-free runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`
- Cached live restore summary: `docs/mobile/harness/odds-api-live-runtime/one-event-cached-restore-summary.redacted.json`
- Stale guard summary: `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json`
- Stale guard run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-run-summary.redacted.json`
- Supervisor summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json`
- Supervisor heartbeat: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-heartbeat.redacted.json`
- Continuous supervisor proof summary: `docs/mobile/harness/odds-api-live-runtime/one-event-continuous-supervisor-proof-summary.redacted.json`
- Trusted result settlement scheduler summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json`
- Safe lifecycle scheduler run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json`
- Runtime status summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- One-command onboarding summary: `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`
- Result: pass.
- Event: Spain vs. France, `soccer_fifa_world_cup`, `2026-07-14T19:00:00Z`.
- Provider calls: one sports scan, quota-free event scans, one event-markets call, and two event-odds refreshes.
- Quota used by provider headers: 13 credits, under the 16-credit cap.
- Latest remaining quota at proof time: 459.
- Stale handling proof: selected market quote lifecycle changed from stale before refresh to ready after refresh.
- Stale trading guard proof: selected market was forced stale, paused, rejected order placement with `MARKET_UNAVAILABLE`, and was restored to `LIVE`.
- Supervisor stale monitor proof: one supervisor cycle ran the stale guard in dry-run mode and reported that all cached markets would pause under the 90-second stale rule; no market was mutated.

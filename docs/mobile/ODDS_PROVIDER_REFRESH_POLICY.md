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
- `npm run mobile:one-event-onboarding -- -RunProviderRefresh` is the explicit one-command path that may spend quota. It reads the key from `THE_ODDS_API_KEY` in the local process environment or from ignored `.runtime/secrets/the-odds-api-key.txt`, never from the command line.
- `npm run mobile:one-event-onboarding -- -AllowDisconnectedS23 -StartRuntimeLoops -StopRuntimeLoopsAfterProof` is the backend-runtime proof mode. It keeps provider refresh in cached/no-quota mode, starts the local supervisor and result-poller, proves both are running, then stops both. Use this when validating local backend runtime without requiring a phone connection.
- `npm run mobile:one-event-onboarding:cached-runtime` is the preferred shortcut for the same cached/no-quota runtime-loop proof mode.
- `npm run mobile:one-event-onboarding:live-provider-runtime` is the explicit shortcut for a live-provider refresh plus runtime-loop proof. It uses the same environment-or-secret-file key loading as `-RunProviderRefresh`, is quota-capped by the underlying onboarding/live-runtime commands, and should only be used when a live provider refresh is intentional.
- `npm run mobile:one-event-live-runtime:provider` is the lower-level explicit live provider proof command and requires `THE_ODDS_API_KEY` in the process environment.
- `npm run mobile:one-event-live-runtime:provider-secret-preflight` checks whether live refresh can obtain the key from the process environment or from `.runtime/secrets/the-odds-api-key.txt`. It is redacted, local-only, and does not call the provider.
- `npm run mobile:one-event-live-runtime:provider-secret` runs the same explicit live provider proof while loading the key from the process environment or from `.runtime/secrets/the-odds-api-key.txt`. The key is never passed on the command line, never printed, and the `.runtime` path is git-ignored.
- `npm run mobile:one-event-live-supervisor` repeats data hygiene, the local one-event runtime check, maker seed, and safe real-time lifecycle scheduler without spending provider quota unless `-RunProviderProof` is passed.
- `npm run mobile:one-event-live-supervisor -- -RunStaleGuard` also runs the stale-provider guard in dry-run monitor mode each cycle. It reports markets that would pause without mutating the tester runtime.
- `npm run mobile:one-event-live-supervisor -- -RunStaleGuard -EnforceStaleGuard` pauses stale `LIVE` markets while the supervisor runs. Use this only after a fresh live provider refresh or when intentionally testing stale-data trade blocking.
- `npm run mobile:one-event-live-supervisor -- -RunResultIngestion -RunResultSettlement` runs provider-shaped result ingestion and trusted-result settlement scheduling in dry-run mode while the supervisor runs. Default result ingestion is replay-fixture based and does not spend provider quota.
- `npm run mobile:one-event-live-supervisor -- -RunResultIngestion -RunLiveResultIngestion -RunResultSettlement` switches result ingestion from replay to live Odds API scores while the supervisor runs. This is opt-in, requires `THE_ODDS_API_KEY`, is cadence-controlled by `-ResultIngestionEveryIterations`, capped by `-MaxLiveResultIngestionRuns`, and limited by `-MaxCreditsPerResultIngestion`.
- `npm run mobile:one-event-live-supervisor -- -RunProviderProof -Continuous -MaxIterations 0` is the local live-provider supervisor mode. It is quota-capped by `-MaxProviderProofRuns` and paced by `-ProviderProofEveryIterations`; use it only for an intentional manual test.
- `npm run mobile:one-event-live-supervisor:continuous-proof` starts the supervisor in continuous cached mode, proves repeated heartbeat cycles with maker reseed, lifecycle scheduler, provider-shaped result ingestion, and result-settlement dry-run checks, checks runtime status, and stops it. It does not spend provider quota.
- `npm run mobile:one-event-runtime-status` reads local proof summaries plus local backend health/quote routes and reports whether the current runtime is cached-only, how fresh the last live proof is, what quota the last proof used, the latest supervisor run profile, broader proven supervisor/result-poller capabilities, maker/lifecycle state, and trusted-result settlement safety. It does not call the provider.
- `npm run mobile:live-runtime-audit-gate` runs the local runtime status, phase audit, and completion audit in that exact order. It does not call the provider or spend quota. Use it when refreshing committed audit evidence so completion summaries cannot accidentally read stale failed phase artifacts.
- `npm run mobile:internal-tester-readiness-gate` runs the ordered audit gate and then refreshes the operator snapshot/checklist. It does not call the provider or spend quota. Use it as the local go/no-go command before handing the S23 flow to a tester.
- `npm run mobile:internal-tester-runtime:cached-start` starts the local tester runtime in volatile artifact mode. Backend/Expo process state, supervisor process state, result-poller process state, loop heartbeats, maker reseed summaries, lifecycle scheduler summaries, result-ingestion summaries, and settlement dry-run summaries are written under `.runtime` instead of committed `docs/mobile/harness` proof files. Use this for manual tester sessions so the git worktree stays clean while local loops run.
- `npm run mobile:internal-tester-runtime:live-provider-start` uses the same volatile artifact mode but opts into the existing quota-gated live provider path. Treat it as an intentional provider refresh because it may spend quota.
- Committed proof summaries under `docs/mobile/harness/odds-api-live-runtime/` remain the audit evidence of record. Runtime-only summaries under `.runtime` are local operational state and should not be committed.
- `GET /api/internal/live-runtime/status` exposes `providerRefreshLoop` for machine-readable provider refresh mode, current supervisor refresh state, cadence, quota caps, latest durable `ProviderRefreshRun`, and mobile freshness thresholds. It does not call the provider or spend quota.
- `npm run mobile:one-event-result-ingest` reads a redacted Odds API scores-shaped fixture and writes trusted result JSON without spending quota.
- `npm run mobile:one-event-result-ingest -- --live` calls the Odds API scores endpoint and requires `THE_ODDS_API_KEY` in the local process environment. Use it only for an intentional result verification because it may spend quota.
- `npm run mobile:one-event-result-settlement-run` reads trusted result JSON and invokes the guarded trusted-result settlement path in dry-run mode by default. It does not call the odds provider and does not execute settlement unless explicit execution flags and confirmation are supplied.
- `npm run mobile:one-event-settlement-preflight` reads trusted result JSON, runs the settlement scheduler in dry-run mode, and reports active-event execution eligibility/blockers without provider quota or mutation.
- `npm run mobile:one-event-settlement-execution-proof` proves settlement mechanics on a fresh disposable local market. It does not call the odds provider, spend quota, or mutate the active tester event.
- Do not print or commit `THE_ODDS_API_KEY`.
- If using the local secret-file path, store only the raw key in `.runtime/secrets/the-odds-api-key.txt`. Do not place quotes, labels, or shell syntax in that file.
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

The local internal status route intentionally reports two freshness lenses:

- Local proof freshness: whether the selected market has stored provider evidence fresh enough for the no-quota internal runtime proof window.
- Mobile-route freshness: whether the same selected market is currently `ready`, `refresh_due`, `stale`, or `unavailable` under the 60/90-second live display thresholds.

This means `/api/internal/live-runtime/status` can be `ready` for cached local internal testing while also reporting `providerSnapshots.mobileLifecycleStatus=stale`. That is expected in no-quota mode. To refresh mobile-visible live odds, use the explicit quota-capped provider refresh commands.

The same status route also returns `operatorNextActions` with local command guidance. The cached internal testing action is no-quota. The mobile live-odds refresh action points operators to `npm run mobile:one-event-live-runtime:provider-secret`, explicitly requires either `THE_ODDS_API_KEY` in the caller's environment or an ignored `.runtime/secrets/the-odds-api-key.txt` file, and may spend quota under the existing caps. The route never returns or reads the key.

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
- Provider-shaped result ingestion summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-summary.redacted.json`
- Trusted result settlement scheduler summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json`
- Trusted result settlement preflight summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-preflight-summary.redacted.json`
- Settlement execution proof summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-execution-summary.redacted.json`
- Safe lifecycle scheduler run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json`
- Runtime status summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- One-command onboarding summary: `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`
- One-command onboarding runtime-loop start/status/stop summaries:
  - `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-start-summary.redacted.json`
  - `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-status-summary.redacted.json`
  - `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-runtime-stop-summary.redacted.json`
- Result: pass.
- Event: Spain vs. France, `soccer_fifa_world_cup`, `2026-07-14T19:00:00Z`.
- Provider calls: one sports scan, quota-free event scans, one event-markets call, and two event-odds refreshes.
- Quota used by provider headers: 13 credits, under the 16-credit cap.
- Latest remaining quota at proof time: 268.
- Stale handling proof: selected market quote lifecycle changed from stale before refresh to ready after refresh.
- Repeatability proof: provider outcome seeding now handles legacy/global outcome slug collisions with deterministic per-market suffixes instead of failing repeat imports.
- Local proof-state hygiene: the live proof records `marketMaker.collateralRepair` if a balanced public `sportsbook-odds` orderbook market needs local collateral metadata reconciled before fake-token maker seeding.
- Latest maker proof: selected `Over 2.5` provider reference bid/ask was `0.4839/0.5239`; local maker shifted bid/ask was `0.46/0.54`.
- Stale trading guard proof: selected market was forced stale, paused, rejected order placement with `MARKET_UNAVAILABLE`, and was restored to `LIVE`.
- Supervisor stale monitor proof: one supervisor cycle ran the stale guard in dry-run mode and reported that all cached markets would pause under the 90-second stale rule; no market was mutated.
- Runtime status proof: status mode reports the closed-market settlement guard, including `executionRequiresMarketStatus=CLOSED` and the latest blocked live-market settlement attempt reason, without spending provider quota. It also separates latest-run supervisor settings from proven repeated runtime capabilities so operator status stays clear after narrow proof runs.
- Settlement preflight proof: active one-event trusted-result dry-run passes, but execution is blocked by `market_not_closed_for_execution:LIVE` until lifecycle close.

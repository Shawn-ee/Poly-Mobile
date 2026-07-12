# Market Maker Live Runtime Report

## Current Status

The Local MVP has deterministic one-shot maker liquidity. A true production daemon is not yet established inside this repo.

## Existing Modes

| Mode | Status | Notes |
| --- | --- | --- |
| One-shot proof liquidity | Working | Harness creates a maker user, mints complete sets, places a resting ask for buy proof and a resting bid for cashout proof. |
| `poly-bot` continuous soak | Not self-contained | `scripts/soak_orderbook_bots.ts` imports `../../poly-bot`, which is outside this repo worktree. Do not treat it as always available. |
| Reference liquidity seeding | Polymarket-only | `referenceLiquiditySeeding.ts` rejects non-Polymarket markets. |
| Odds API local shifted maker | Added as proof mode | The one-event live proof places local bid/ask quotes around provider reference price, shifted worse by configurable ticks. |
| Odds API reusable maker seed | Added for local testing | `npm run mobile:one-event-live-maker-seed` uses the latest stored sportsbook snapshot, cancels prior local shifted-maker quotes for the selected market, and leaves a new fake-token bid/ask resting. |
| Odds API one-event supervisor | Added for local testing | `npm run mobile:one-event-live-supervisor` repeats runtime checks and maker reseeding while the command is running. With `-RunProviderProof`, it also runs quota-guarded live provider refresh cycles. |
| Supervisor stale-provider monitor | Added for local testing | `npm run mobile:one-event-live-supervisor -- -RunStaleGuard` reports stale-provider would-pause counts each cycle. Add `-EnforceStaleGuard` to pause stale markets intentionally. |
| Supervisor trusted-result settlement monitor | Added for local testing | `npm run mobile:one-event-live-supervisor -- -RunResultIngestion -RunResultSettlement` runs provider-shaped result ingestion and the trusted-result settlement scheduler in dry-run mode each cycle. |
| Supervisor live-result ingestion mode | Added for local testing | `npm run mobile:one-event-live-supervisor -- -RunResultIngestion -RunLiveResultIngestion -RunResultSettlement` makes live Odds API scores ingestion opt-in, quota-capped, and cadence-controlled while keeping settlement dry-run by default. |
| Provider-shaped result ingestion | Added for local testing | `npm run mobile:one-event-result-ingest` converts an Odds API scores-shaped payload into trusted result JSON. Replay fixture mode is default and quota-free; live mode requires explicit `--live` and `THE_ODDS_API_KEY`. |
| Disposable settlement execution proof | Added for local testing | `npm run mobile:one-event-settlement-execution-proof` creates a fresh disposable local market, executes settlement, and verifies payout conservation, collateral cleanup, finalized positions, no negative balances, and no stuck locks without mutating the active tester event. |
| Trusted result scheduler execution proof | Added for local testing | `npm run mobile:one-event-result-settlement-execution-proof` creates a disposable sportsbook-shaped event, dry-runs trusted-result scheduler settlement, executes with the exact confirmation phrase, and proves active tester event safety. |
| One-event runtime status report | Added for operator safety | `npm run mobile:one-event-runtime-status` reads local proof summaries and backend health/quote routes to report cached-vs-live mode, live proof freshness, quota from the last provider proof, maker quote status, scheduler state, trusted-result settlement guard status, the latest supervisor run profile, and broader proven supervisor/result-poller capabilities without calling the provider. |
| Local background supervisor process | Added for internal runtime testing | `npm run mobile:one-event-live-supervisor:process -- -Action start` starts the supervisor hidden with process state/log files; status and stop wrappers are available. This is local process management, not an installed OS service. |
| Continuous local supervisor proof | Added for internal runtime testing | `npm run mobile:one-event-live-supervisor:continuous-proof` starts the local supervisor in continuous mode, waits for heartbeat proof of at least one completed cycle, confirms the process is still running, checks runtime status, then stops it cleanly. |
| Internal tester runtime manager | Added for internal tester launch | `npm run mobile:internal-tester-runtime -- -Action status/start/stop` reports backend, Expo, Docker/Postgres, S23, and supervisor status. It can start backend/Expo when ports are free and can optionally start the supervisor, while reusing external listeners and stopping only manager-owned processes. |

## Live Proof Strategy

For a selected binary sportsbook market:

- Provider midpoint comes from latest `ReferenceQuoteSnapshot`.
- Local maker bid is provider bid shifted down by `QUOTE_OFFSET_TICKS`.
- Local maker ask is provider ask shifted up by `QUOTE_OFFSET_TICKS`.
- If only a midpoint exists, the proof builds a small local spread around it.
- The proof cancels its own previous local maker quotes before placing replacements.
- The proof does not start a permanent unattended bot by default.

## Remaining Gaps

| Gap | Priority |
| --- | --- |
| Long-lived source-aware maker daemon with risk state | P1 |
| Automatic quote replacement on every provider refresh | Partial: supervisor can reseed after each refresh while running; no installed unattended service yet. |
| Inventory-aware maker across many markets | P2 |
| Production risk controls and monitoring | P2 |

## Latest Proof

- Command: `npm run mobile:odds-api-live-runtime-proof -- --skipSleep --refreshIterations=2 --maxCredits=16 --minRemaining=2`
- One-command onboarding: `npm run mobile:one-event-onboarding`
- Restart/runtime command: `npm run mobile:one-event-live-runtime`
- Runtime command with maker liquidity: `npm run mobile:one-event-live-runtime -- -SeedMaker`
- Consolidated readiness command: `npm run mobile:one-event-live-readiness`
- Repeated local supervisor command: `npm run mobile:one-event-live-supervisor -- -MaxIterations 2 -IntervalSeconds 1`
- Repeated local supervisor with stale monitor: `npm run mobile:one-event-live-supervisor -- -RunStaleGuard -MaxIterations 1 -IntervalSeconds 0 -SkipSleep`
- Repeated local supervisor with live result ingestion: `npm run mobile:one-event-live-supervisor -- -RunResultIngestion -RunLiveResultIngestion -RunResultSettlement -MaxLiveResultIngestionRuns 1 -ResultIngestionEveryIterations 1`
- Local background supervisor command: `npm run mobile:one-event-live-supervisor:process -- -Action start -Continuous -MaxIterations 0`
- Local background supervisor status/stop: `npm run mobile:one-event-live-supervisor:status`, `npm run mobile:one-event-live-supervisor:stop`
- Continuous local supervisor proof: `npm run mobile:one-event-live-supervisor:continuous-proof`
- Internal tester runtime manager status: `npm run mobile:internal-tester-runtime -- -Action status`
- Runtime status command: `npm run mobile:one-event-runtime-status`
- Maker seed command: `npm run mobile:one-event-live-maker-seed`
- Lifecycle controls command: `npm run mobile:one-event-lifecycle-proof`
- Settlement readiness command: `npm run mobile:one-event-settlement-readiness`
- Settlement execution proof command: `npm run mobile:one-event-settlement-execution-proof`
- Manual settlement dry-run command: `npm run mobile:one-event-settlement -- --winningOutcome=over`
- Provider-shaped result ingestion command: `npm run mobile:one-event-result-ingest`
- Trusted result settlement scheduler command: `npm run mobile:one-event-result-settlement-run`
- Trusted result scheduler execution proof command: `npm run mobile:one-event-result-settlement-execution-proof`
- Live provider wrapper command: `npm run mobile:one-event-live-runtime:provider`
- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`
- Maker seed summary: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
- Lifecycle controls summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json`
- Consolidated readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json`
- Supervisor summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json`
- Supervisor process summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-process-summary.redacted.json`
- Runtime status summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Settlement readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json`
- Settlement execution proof summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-execution-summary.redacted.json`
- Manual settlement dry-run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json`
- Provider-shaped result ingestion summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-summary.redacted.json`
- Trusted result settlement scheduler summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json`
- Trusted result scheduler execution proof summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-summary.redacted.json`
- One-command onboarding summary: `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`
- Internal tester runtime manager summary: `docs/mobile/harness/odds-api-live-runtime/internal-tester-runtime-manager-summary.redacted.json`
- Result: pass.
- Provider event: Spain vs. France, `soccer_fifa_world_cup`, starts `2026-07-14T19:00:00Z`.
- Selected local market: Total Goals 2.5.
- Provider reference: bid `0.4891`, ask `0.5291`.
- Local maker quote: bid `0.47`, ask `0.55`, shifted worse than provider by two ticks.
- Reusable maker seed proof: quote route returned best bid `0.47` and best ask `0.55` for the selected provider-backed market after `-SeedMaker`.
- Trading proof: fake-token buy filled, Portfolio position appeared, sell/cashout filled, History contained both trades.
- Settlement readiness proof: both selected outcomes preview successfully without mutation, payout conservation passes, and automatic official-result settlement remains a separate P1 gap.
- Settlement execution proof: a fresh disposable local market settles with payout conservation passing, collateral zero after settlement, finalized positions, no negative balances, and no stuck locks. The active tester event is not mutated by this proof.
- Manual settlement proof: dry-run command selected `Over +2.5`, proved payout conservation, printed the explicit execution confirmation phrase, and left the market unresolved.
- Provider-shaped result ingestion proof: replay mode converts a redacted Odds API scores-shaped payload into trusted result JSON for the selected proof event without spending quota.
- Live result ingestion supervisor path: available only through explicit `-RunLiveResultIngestion`, with `THE_ODDS_API_KEY`, result-ingestion cadence, max live-result run count, and per-run credit cap. The latest committed proof keeps replay/no-quota mode.
- Trusted result scheduler proof: dry-run scheduler command reads trusted result JSON and invokes guarded trusted-result settlement without mutating the market.
- Trusted result scheduler execution proof: disposable scheduler proof executes the same trusted-result settlement path with the exact confirmation phrase, resolves only the disposable market, and confirms the active tester event is not mutated.
- Runtime status settlement safety: the status report now surfaces that trusted-result execution requires `CLOSED` market status and that the latest live-market execute attempt was blocked without resolving the proof market.
- Runtime status capability truth: the status report now separates the latest supervisor run profile from prior passing continuous supervisor/result-poller proof artifacts, so a narrow latest proof does not hide proven repeated maker reseed, lifecycle scheduling, result ingestion, and result-poller behavior.
- One-command onboarding proof: quota-free replay/import, readiness, runtime status, settlement readiness, and settlement dry-run all passed with S23 connected.
- Supervisor stale monitor proof: one supervisor cycle ran data hygiene, runtime/maker seed, dry-run stale guard, and safe lifecycle scheduler. It reported 19 cached markets that would pause under the 90-second stale threshold and did not mutate markets.
- Continuous local supervisor proof: the repeated local supervisor proof emits heartbeat evidence and keeps shifted maker reseeding, lifecycle checks, provider-shaped result ingestion, and trusted-result settlement dry-run scheduling active across cycles without leaving the proof supervisor running.
- S23 proof: `docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json`.
- Continuous status: the supervisor can run repeated local maker reseeds while it is open, but there is still no installed unattended production bot.
- Internal tester runtime status: the manager reports backend, Expo, Docker/Postgres, S23, and supervisor process state without provider quota. It is a local tester control plane and does not replace an installed production daemon.

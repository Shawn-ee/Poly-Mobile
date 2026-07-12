# Backend Live Runtime Survey

Generated for the Backend Live Runtime Survey + One Event Live Pipeline goal.

## Current Truth

The current Local MVP is backend-owned and fake-token only. It has proven one sportsbook event with Odds API replay data, route visibility, order placement, Portfolio, cashout/sell, and History. That proof is not the same as a continuous live provider/runtime.

## Existing Pieces

| Area | Existing implementation | Current runtime status |
| --- | --- | --- |
| Odds API import | `src/server/services/theOddsApiSingleEventProvider.ts` and `scripts/seed_the_odds_api_single_event.ts` can fetch or replay one soccer event, normalize markets, upsert `Event`, `Market`, `Outcome`, and `ReferenceQuoteSnapshot`. | Live fetch is one-shot. Replay is default for proof. No long-lived polling loop was present before this goal. |
| One-command local onboarding | `scripts/onboard_holiwyn_one_event_live_runtime.ps1` replays or optionally live-refreshes one provider-shaped event, then runs readiness, runtime status, settlement readiness, and manual settlement dry-run. | Proven in quota-free replay mode. Live provider mode requires explicit `-RunProviderRefresh` and `THE_ODDS_API_KEY`. |
| Cached live-runtime restore | `scripts/restore_odds_api_one_event_from_live_summary.ts` restores the reusable local one-event slug from the latest passing live-runtime summary when the redacted replay fixture is older than the selected upcoming event. | Proven in quota-free onboarding mode. It prevents stale replay drift without spending provider quota. |
| Quota protection | `assertQuotaBudget`, `quotaCost`, redacted call records, and `MAX_CREDITS=8` in the seed script. | Present for one-shot import. Needs explicit refresh policy for live loop cadence. |
| Mobile route stack | `GET /api/events`, `GET /api/mobile/events/:slug/live-detail`, `GET /api/markets/:id/quote`, `POST /api/orders`, `GET /api/portfolio`, `GET /api/portfolio/history`. | Proven for replay event. Can support a live-refreshed backend event if snapshots/orders are seeded. |
| Provider lifecycle surface | `mobileLiveEventDetail.ts` reports quote/depth/chart lifecycle as `ready`, `refresh_due`, `stale`, or `unavailable`. Quote snapshots are stale after 90 seconds and refresh-due after 60 seconds. | Exists. Needs a provider refresh runner to keep snapshots fresh. |
| Local matching/order flow | `matching.ts`, canonical order route, Portfolio/history routes. | Proven for fake-token buy/sell and negative sell cases. |
| One-shot maker liquidity | Internal harnesses mint complete sets and place maker ask/bid orders directly with `placeOrderAndMatch`. | Works for proof. Not continuous by default. |
| One-event local supervisor | `scripts/run_holiwyn_one_event_live_supervisor.ps1` repeats data hygiene, the proven runtime launch command, local maker reseeding, and the safe real-time lifecycle scheduler on an interval. It can optionally run quota-guarded provider refresh, stale guard, replay result ingestion, opt-in quota-capped live result ingestion, and trusted-result settlement scheduling, and it writes heartbeat evidence after each cycle. | Continuous only while the local command is running. `npm run mobile:one-event-live-supervisor:continuous-proof` proves repeated local cycles, replay-mode result ingestion, dry-run result settlement scheduling, and clean stop behavior. Live result ingestion requires `-RunLiveResultIngestion` plus `THE_ODDS_API_KEY` and is capped by run count/cadence/credits. It is not an installed unattended service. |
| Internal tester runtime manager | `scripts/manage_holiwyn_internal_tester_runtime.ps1` provides local start/status/stop orchestration for backend, Expo, Docker/Postgres visibility, S23 reachability, and one-event supervisor status. It reuses existing backend/Expo listeners when ports are already occupied and stops only manager-owned backend/Expo processes. | Status proof passed without provider quota. This is an internal local control plane for tester launch, not an installed OS service or production daemon. |
| Local runtime scheduled-task manager | `scripts/manage_holiwyn_local_runtime_task.ps1` plans, reports, installs, or uninstalls a Windows scheduled task that starts the internal tester runtime. `scripts/prove_holiwyn_local_runtime_task_install_uninstall.ps1` audits install/remove safety. | Dry-run plan proof passed without provider quota and confirmed no scheduled task is installed by default. Install/uninstall audit confirms Windows denies registration in the current process context, cleanup leaves no task installed, and elevated/task-registration rights are needed before applying. |
| Local runtime user Startup launcher | `scripts/manage_holiwyn_local_runtime_startup.ps1` plans, reports, installs, or uninstalls a current-user Windows Startup folder `.cmd` launcher that starts the internal tester runtime at user logon. `scripts/prove_holiwyn_local_runtime_startup_install_uninstall.ps1` audits install/remove safety with a proof-only launcher. | Plan and install/uninstall proof are local-only and spend no provider quota by default. This is a practical user-logon fallback when scheduled-task registration is denied, not an installed production service or health-monitored daemon. |
| Continuous bot/soak harness | `scripts/soak_orderbook_bots.ts` references a sibling `poly-bot` package. `scripts/create_sim_bot_credentials.ts` writes bot config to `../poly-bot`. | Not self-contained in this repo. Do not assume it is running or available for mobile MVP runtime. |
| Reference liquidity seeding | `referenceLiquiditySeeding.ts` supports approved Polymarket reference markets only. | Not usable for Odds API sportsbook markets without new source-aware logic. |
| Event pause/close/resolve | Admin routes can pause/close markets and resolve orderbook markets. | Manual/admin lifecycle exists. No automatic soccer settlement or result ingest exists yet. |
| One-event lifecycle scheduler | `src/server/services/oneEventLifecycleScheduler.ts` can pause the selected event inside the pre-start suspend window and close it at/after start. `scripts/run_odds_api_one_event_lifecycle_scheduler.ts` runs it safely against the real current time; `scripts/prove_odds_api_event_lifecycle_scheduler.ts` proves pause/close by temporarily mutating start times and restoring them. | Proven locally. The supervisor now calls the safe scheduler each cycle while active, but it is not installed as an unattended daemon/service. |
| Stale provider trading guard | `scripts/prove_odds_api_one_event_stale_guard.ts` proves local stale-data handling by forcing selected provider snapshots stale, pausing the market, verifying `POST /api/orders` rejects, and restoring the market/snapshots. | Proven as a local callable proof. It is not installed as an unattended service. |
| Supervisor stale-provider monitor/enforcer | `scripts/run_odds_api_one_event_stale_guard.ts` can run in dry-run monitor mode or enforcement mode, and `run_holiwyn_one_event_live_supervisor.ps1` can invoke it every cycle with `-RunStaleGuard`. | Proven in one supervisor cycle in dry-run mode. Enforcement is available through `-EnforceStaleGuard`, but it is still local process behavior. |
| One-event phase audit | `scripts/report_odds_api_live_runtime_phase_audit.ts` reads all live-runtime proof summaries plus local health/quote routes and reports P0/P1/P2 phase status. | Proven locally. Current result has 0 open P0 gaps for the local internal one-event runtime, with unattended services and official result auto-settlement open as P1. |
| Settlement | `settlement.ts`, `previewOrderbookSettlement`, `resolveOrderbookMarket`, admin preview/resolve routes, `scripts/settle_odds_api_one_event_market.ts`, and `scripts/prove_odds_api_one_event_settlement_execution.ts` exist for orderbook markets. | Manual/admin-driven for the active tester event. Non-mutating readiness, guarded one-event manual dry run, trusted-result dry run, and disposable local execution proof exist; unattended official result polling and unconfirmed active-event execution remain P1. |
| Trusted result settlement intake | `scripts/ingest_odds_api_one_event_result.ts` converts an Odds API scores payload into trusted soccer result JSON. `scripts/settle_odds_api_one_event_from_result.ts` maps that result evidence to a winning outcome, previews settlement, and keeps execution behind an exact result-digest confirmation phrase plus a closed-market execution guard. `scripts/run_odds_api_one_event_result_settlement_scheduler.ts` can run that path from a local scheduler/cron style command, dry-run by default. `scripts/report_odds_api_one_event_settlement_preflight.ts` reports active-event execution eligibility and blockers without mutation. `scripts/prove_odds_api_trusted_result_settlement_scheduler_execution.ts` proves the scheduler execute path on a disposable sportsbook-shaped event. | Provider-shaped replay ingestion and dry-run scheduling are proven for Spain vs. France Total Goals 2.5. Active-event preflight reports final trusted result evidence and passing payout preview, but current execution is blocked by `market_not_closed_for_execution:LIVE`. Trusted-result scheduler execution is proven on disposable local evidence without mutating the active tester event, including a live-market blocked execution check before closing and settling the disposable market. Live score ingestion is available through explicit `--live` or supervisor `-RunLiveResultIngestion`, both requiring `THE_ODDS_API_KEY`; installed unattended official result polling and unconfirmed active-event execution remain P1. |

## Odds API Usage Classification

| Mode | Current support |
| --- | --- |
| Replay fixture only | Yes. `npm run mobile:odds-api-internal-env-proof` defaults to committed redacted Odds API evidence and makes no provider calls. |
| One-time live import | Yes, when `THE_ODDS_API_KEY` is provided to `npm run mobile:the-odds-api-single-event`. |
| Live provider polling | Not previously present as a product runtime. Added as a minimal proof script in this goal, not yet a production daemon. |

## Missing For A Real Live Local Event

| Gap | Priority | Notes |
| --- | --- | --- |
| Source-aware Odds API refresh loop | P0 for this goal | Need configurable interval, quota cap, stale detection, and failure handling. |
| Continuous local market maker tied to provider odds | P0 for this goal | Need maker quotes shifted worse than provider, with risk caps and cleanup. |
| Auto-close/suspend near event start or provider unavailable | P1 | Start-time pause/close now runs inside the foreground supervisor while it is active. A stale-provider pause guard is proven as a callable command. Neither is installed as an always-on daemon. |
| Automatic settlement from official result | P1 | Existing settlement can ingest provider-shaped score evidence into trusted result JSON and run a scheduler-style dry run, but live score ingestion is explicit/manual and no unattended result polling or unconfirmed execution is wired. |
| Production bot daemon ownership | P1 | `poly-bot` is not inside this repo, so mobile repo must not claim continuous bot readiness from that script alone. |

## Survey Conclusion

The backend is close enough for a one-event local live proof because the data model, mobile routes, fake-token matcher, provider snapshot model, and manual lifecycle routes already exist. The missing piece is a small live runner that refreshes one provider event, keeps reference snapshots fresh, places local maker quotes based on those snapshots, and proves mobile route/order/portfolio behavior against the same event.

## Proof Added In This Goal

- Command: `npm run mobile:odds-api-live-runtime-proof`.
- Restart/runtime command: `npm run mobile:one-event-live-runtime`.
- Explicit live-provider wrapper: `npm run mobile:one-event-live-runtime:provider`.
- Script: `scripts/prove_odds_api_one_event_live_runtime.ts`.
- Runtime launcher: `scripts/start_holiwyn_one_event_live_runtime.ps1`.
- Reusable maker seed: `scripts/seed_odds_api_live_shifted_maker.ts`.
- Lifecycle controls proof: `scripts/prove_odds_api_event_lifecycle_controls.ts`.
- Lifecycle scheduler proof: `scripts/prove_odds_api_event_lifecycle_scheduler.ts`.
- Safe lifecycle scheduler runner: `scripts/run_odds_api_one_event_lifecycle_scheduler.ts`.
- Consolidated readiness gate: `scripts/prove_holiwyn_one_event_live_readiness.ps1`.
- One-event local supervisor: `scripts/run_holiwyn_one_event_live_supervisor.ps1`.
- Continuous local supervisor proof: `scripts/prove_holiwyn_one_event_continuous_supervisor.ps1`.
- Settlement readiness report: `scripts/report_odds_api_one_event_settlement_readiness.ts`.
- Guarded manual settlement command: `scripts/settle_odds_api_one_event_market.ts`.
- Disposable settlement execution proof: `scripts/prove_odds_api_one_event_settlement_execution.ts`.
- Provider-shaped result ingestion command: `scripts/ingest_odds_api_one_event_result.ts`.
- Trusted result settlement command: `scripts/settle_odds_api_one_event_from_result.ts`.
- Trusted result settlement scheduler run: `scripts/run_odds_api_one_event_result_settlement_scheduler.ts`.
- Active event settlement preflight: `scripts/report_odds_api_one_event_settlement_preflight.ts`.
- Trusted result settlement scheduler execution proof: `scripts/prove_odds_api_trusted_result_settlement_scheduler_execution.ts`.
- One-command onboarding wrapper: `scripts/onboard_holiwyn_one_event_live_runtime.ps1`.
- Cached live-runtime restore: `scripts/restore_odds_api_one_event_from_live_summary.ts`.
- Stale provider trading guard: `scripts/prove_odds_api_one_event_stale_guard.ts`.
- Supervisor stale-provider monitor/enforcer: `scripts/run_odds_api_one_event_stale_guard.ts`.
- Live-runtime phase audit: `scripts/report_odds_api_live_runtime_phase_audit.ts`.
- Internal tester runtime manager: `scripts/manage_holiwyn_internal_tester_runtime.ps1`.
- Local runtime scheduled-task manager: `scripts/manage_holiwyn_local_runtime_task.ps1`.
- Local runtime scheduled-task install/uninstall proof: `scripts/prove_holiwyn_local_runtime_task_install_uninstall.ps1`.
- Local runtime user Startup launcher manager: `scripts/manage_holiwyn_local_runtime_startup.ps1`.
- Local runtime user Startup launcher install/uninstall proof: `scripts/prove_holiwyn_local_runtime_startup_install_uninstall.ps1`.
- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`.
- Runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`.
- Maker seed summary: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`.
- Lifecycle controls summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json`.
- Lifecycle scheduler summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-scheduler-summary.redacted.json`.
- Safe lifecycle scheduler run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json`.
- Settlement readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json`.
- Settlement execution proof summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-execution-summary.redacted.json`.
- Manual settlement dry-run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json`.
- Provider-shaped score fixture: `docs/mobile/harness/odds-api-live-runtime/odds-api-score-fixture.redacted.json`.
- Provider-shaped result ingestion summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-ingestion-summary.redacted.json`.
- Provider-ingested trusted result output: `docs/mobile/harness/odds-api-live-runtime/trusted-result-provider.redacted.json`.
- Trusted result settlement summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-summary.redacted.json`.
- Trusted result settlement scheduler summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-run-summary.redacted.json`.
- Trusted result settlement preflight summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-preflight-summary.redacted.json`.
- Trusted result settlement scheduler execution summary: `docs/mobile/harness/odds-api-live-runtime/one-event-result-settlement-scheduler-execution-summary.redacted.json`.
- One-command onboarding summary: `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`.
- Cached live restore summary: `docs/mobile/harness/odds-api-live-runtime/one-event-cached-restore-summary.redacted.json`.
- Stale guard summary: `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json`.
- Stale guard run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-run-summary.redacted.json`.
- Live-runtime phase audit summary: `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`.
- Internal tester runtime manager summary: `docs/mobile/harness/odds-api-live-runtime/internal-tester-runtime-manager-summary.redacted.json`.
- Local runtime scheduled-task summary: `docs/mobile/harness/odds-api-live-runtime/local-runtime-task-summary.redacted.json`.
- Local runtime scheduled-task install/uninstall summary: `docs/mobile/harness/odds-api-live-runtime/local-runtime-task-install-uninstall-summary.redacted.json`.
- Local runtime user Startup launcher summary: `docs/mobile/harness/odds-api-live-runtime/local-runtime-startup-summary.redacted.json`.
- Local runtime user Startup launcher install/uninstall summary: `docs/mobile/harness/odds-api-live-runtime/local-runtime-startup-install-uninstall-summary.redacted.json`.
- Consolidated readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json`.
- Supervisor summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json`.
- Supervisor heartbeat: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-heartbeat.redacted.json`.
- Continuous supervisor proof summary: `docs/mobile/harness/odds-api-live-runtime/one-event-continuous-supervisor-proof-summary.redacted.json`.
- S23 summary: `docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json`.
- Result: pass.
- The proof is bounded and local-only. It proves the minimum live path for one upcoming provider event and now has a foreground supervisor that repeats hygiene, cached runtime checks, shifted maker seeding, safe lifecycle scheduling, provider-shaped result ingestion, and trusted-result settlement dry-runs while it runs. Settlement execution is proven separately on a fresh disposable local market so the active tester event is not mutated. It is not an unattended production daemon.

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
| One-event local supervisor | `scripts/run_holiwyn_one_event_live_supervisor.ps1` repeats data hygiene, the proven runtime launch command, local maker reseeding, and the safe real-time lifecycle scheduler on an interval. It can optionally run quota-guarded provider refresh. | Continuous only while the local command is running. It is not an installed unattended service. |
| Continuous bot/soak harness | `scripts/soak_orderbook_bots.ts` references a sibling `poly-bot` package. `scripts/create_sim_bot_credentials.ts` writes bot config to `../poly-bot`. | Not self-contained in this repo. Do not assume it is running or available for mobile MVP runtime. |
| Reference liquidity seeding | `referenceLiquiditySeeding.ts` supports approved Polymarket reference markets only. | Not usable for Odds API sportsbook markets without new source-aware logic. |
| Event pause/close/resolve | Admin routes can pause/close markets and resolve orderbook markets. | Manual/admin lifecycle exists. No automatic soccer settlement or result ingest exists yet. |
| One-event lifecycle scheduler | `src/server/services/oneEventLifecycleScheduler.ts` can pause the selected event inside the pre-start suspend window and close it at/after start. `scripts/run_odds_api_one_event_lifecycle_scheduler.ts` runs it safely against the real current time; `scripts/prove_odds_api_event_lifecycle_scheduler.ts` proves pause/close by temporarily mutating start times and restoring them. | Proven locally. The supervisor now calls the safe scheduler each cycle while active, but it is not installed as an unattended daemon/service. |
| Stale provider trading guard | `scripts/prove_odds_api_one_event_stale_guard.ts` proves local stale-data handling by forcing selected provider snapshots stale, pausing the market, verifying `POST /api/orders` rejects, and restoring the market/snapshots. | Proven as a local callable proof. It is not installed as an unattended service. |
| Supervisor stale-provider monitor/enforcer | `scripts/run_odds_api_one_event_stale_guard.ts` can run in dry-run monitor mode or enforcement mode, and `run_holiwyn_one_event_live_supervisor.ps1` can invoke it every cycle with `-RunStaleGuard`. | Proven in one supervisor cycle in dry-run mode. Enforcement is available through `-EnforceStaleGuard`, but it is still local process behavior. |
| Settlement | `settlement.ts`, `previewOrderbookSettlement`, `resolveOrderbookMarket`, admin preview/resolve routes, and `scripts/settle_odds_api_one_event_market.ts` exist for orderbook markets. | Manual/admin-driven. Non-mutating readiness proof and a guarded one-event manual settlement dry run exist; automatic sports result ingestion and automatic settlement are not implemented. |

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
| Automatic settlement from official result | P1 | Existing settlement is manual/admin. The selected market can be previewed and has a guarded manual command, but no final soccer result provider is wired. |
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
- Settlement readiness report: `scripts/report_odds_api_one_event_settlement_readiness.ts`.
- Guarded manual settlement command: `scripts/settle_odds_api_one_event_market.ts`.
- One-command onboarding wrapper: `scripts/onboard_holiwyn_one_event_live_runtime.ps1`.
- Cached live-runtime restore: `scripts/restore_odds_api_one_event_from_live_summary.ts`.
- Stale provider trading guard: `scripts/prove_odds_api_one_event_stale_guard.ts`.
- Supervisor stale-provider monitor/enforcer: `scripts/run_odds_api_one_event_stale_guard.ts`.
- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`.
- Runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`.
- Maker seed summary: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`.
- Lifecycle controls summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json`.
- Lifecycle scheduler summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-scheduler-summary.redacted.json`.
- Safe lifecycle scheduler run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json`.
- Settlement readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json`.
- Manual settlement dry-run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json`.
- One-command onboarding summary: `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`.
- Cached live restore summary: `docs/mobile/harness/odds-api-live-runtime/one-event-cached-restore-summary.redacted.json`.
- Stale guard summary: `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json`.
- Stale guard run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-run-summary.redacted.json`.
- Consolidated readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json`.
- Supervisor summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json`.
- S23 summary: `docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json`.
- Result: pass.
- The proof is bounded and local-only. It proves the minimum live path for one upcoming provider event and now has a foreground supervisor that repeats hygiene, cached runtime checks, shifted maker seeding, and safe lifecycle scheduling while it runs. It is not an unattended production daemon.

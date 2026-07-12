# Event Lifecycle Runbook

## Local MVP Lifecycle

| State | Meaning | Current support |
| --- | --- | --- |
| Open / LIVE | Users can quote, buy, sell, and see Portfolio/history. | Supported by `Market.status=LIVE` and existing order routes. |
| Refresh due | Provider quote snapshot is still usable but should refresh. | Surfaced by event detail provider lifecycle fields. |
| Stale | Provider quote snapshot is older than route stale threshold. | Surfaced by event detail provider lifecycle fields. The local stale guard can pause a `LIVE` market with `settlementStatus=paused_provider_stale`, causing orders to reject with `MARKET_UNAVAILABLE`. |
| Suspended / PAUSED | Trading disabled near event start or manually. | `runOneEventLifecycleScheduler` can set `Market.status=PAUSED` inside the pre-start suspend window; admin pause route also exists. |
| Closed | Trading disabled at/after event start or manually. | `runOneEventLifecycleScheduler` can set `Market.status=CLOSED` and cancels open orders; admin close route also exists. |
| Settled / resolved | Winning outcome selected and collateral settled. | Admin/manual orderbook resolve route exists. Automatic soccer settlement is not implemented. |

## Operator Steps For One Local Live Event

1. Start Postgres and backend.
2. For a quota-free one-command onboarding pass, run `npm run mobile:one-event-onboarding`. It blocks stale replay by default and restores the cached live-runtime event if the redacted replay fixture is older than the selected upcoming event.
3. For the same onboarding pass with a live provider refresh, set `THE_ODDS_API_KEY` in the local process environment and run `npm run mobile:one-event-onboarding -- -RunProviderRefresh`.
4. For only a quota-free consolidated readiness pass, run `npm run mobile:one-event-live-readiness`.
5. For only a quota-free restart check, run `npm run mobile:one-event-live-runtime`.
6. To leave local fake-token liquidity available for testers, run `npm run mobile:one-event-live-runtime -- -SeedMaker`.
7. To keep the one-event local runtime warm for repeated internal checks, run `npm run mobile:one-event-live-supervisor -- -MaxIterations 2 -IntervalSeconds 1`. This foreground loop runs data hygiene, runtime/maker refresh, and the safe real-time lifecycle scheduler each cycle.
8. To run the same supervisor as a local hidden background process, run `npm run mobile:one-event-live-supervisor:process -- -Action start -Continuous -MaxIterations 0`.
9. To check that local background supervisor process, run `npm run mobile:one-event-live-supervisor:status`.
10. To stop that local background supervisor process, run `npm run mobile:one-event-live-supervisor:stop`.
11. For a live provider refresh proof only, set `THE_ODDS_API_KEY` in the local process environment and run `npm run mobile:one-event-live-runtime:provider`.
12. For a repeated live-provider supervisor, run `npm run mobile:one-event-live-supervisor -- -RunProviderProof -Continuous -MaxIterations 0` only during intentional manual testing; provider refresh is capped by cadence and max proof runs.
13. Confirm the proof reports provider refresh `ready`.
14. Confirm local shifted maker quotes exist.
15. Open mobile and trade the selected event with fake tokens.
16. To prove local lifecycle controls only, run `npm run mobile:one-event-lifecycle-proof`.
17. To run the safe real-time lifecycle scheduler once, run `npm run mobile:one-event-lifecycle-scheduler-run`.
18. To prove local start-time lifecycle automation with temporary event-time mutations and restore, run `npm run mobile:one-event-lifecycle-scheduler-proof`.
19. To prove non-mutating settlement readiness, run `npm run mobile:one-event-settlement-readiness`.
20. To dry-run the manual settlement command after a trusted result is known, run `npm run mobile:one-event-settlement -- --winningOutcome=over` or pass the winning outcome id.
21. To execute settlement, pass `--execute` plus the exact `--confirm=SETTLE:<marketId>:<outcomeId>` phrase printed by the dry run. Do not execute without trusted result review.
22. To prove stale provider handling, run `npm run mobile:one-event-stale-guard-proof`. It forces stored snapshots stale, pauses the selected market, proves order rejection, and restores state after proof.
23. To monitor stale provider handling inside the supervisor without mutating local tester state, run `npm run mobile:one-event-live-supervisor -- -RunStaleGuard -MaxIterations 1 -IntervalSeconds 0 -SkipSleep`.
24. To enforce stale provider handling inside the supervisor, add `-EnforceStaleGuard`. Use enforcement only when you intend stale markets to pause.
25. Do not settle automatically unless official result input and admin review are added.

## Completion Boundary

This runbook supports internal fake-token testing. It does not approve real-money deployment, automatic settlement, public liquidity, or unattended production bots.

## Latest Lifecycle Proof

- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Restart/runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`
- Maker seed summary: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
- Lifecycle controls summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json`
- Lifecycle scheduler summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-scheduler-summary.redacted.json`
- Safe lifecycle scheduler run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json`
- Settlement readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-settlement-readiness-summary.redacted.json`
- Manual settlement dry-run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-manual-settlement-summary.redacted.json`
- One-command onboarding summary: `docs/mobile/harness/odds-api-live-runtime/one-event-onboarding-summary.redacted.json`
- Cached live restore summary: `docs/mobile/harness/odds-api-live-runtime/one-event-cached-restore-summary.redacted.json`
- Stale guard summary: `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-summary.redacted.json`
- Stale guard run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-run-summary.redacted.json`
- Consolidated readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json`
- Supervisor summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json`
- Supervisor process summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-process-summary.redacted.json`
- S23 visible proof: `docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json`
- Open state: selected market was `LIVE`, visible on Home, visible on Event Detail, and accepted fake-token orders.
- Stale state: proof forced selected quote snapshots stale, Event Detail reported stale provider quote lifecycle, and the stale guard paused trading so order placement failed with `MARKET_UNAVAILABLE`.
- Refreshed state: live Odds API refresh restored selected quote lifecycle to ready.
- Closed state: temporarily setting the selected market to `CLOSED` caused order placement to fail with `MARKET_UNAVAILABLE`.
- Lifecycle controls proof: selected market accepted an order in `LIVE`, rejected orders in `PAUSED` and `CLOSED`, produced a non-mutating settlement preview, and restored the market to its original state.
- Lifecycle scheduler proof: selected event had no action outside the suspend window, paused markets inside the suspend window, closed markets after event start, rejected orders in paused/closed states, restored event/market status, and reseeded local maker quotes.
- Supervisor stale monitor: latest supervisor proof ran the stale guard in dry-run mode and reported 19 cached markets that would pause under the 90-second provider-stale threshold. It did not mutate markets because enforcement was not requested.
- Settlement readiness: `previewOrderbookSettlement` and `resolveOrderbookMarket` exist. The latest non-mutating readiness proof previews both selected outcomes with payout conservation passing and confirms the market is not resolved by the proof. Automatic soccer result ingestion and automatic settlement remain P1.
- Manual settlement command: `npm run mobile:one-event-settlement -- --winningOutcome=over` dry-runs the selected event settlement, prints the exact confirmation phrase required for execution, and confirms the market remains unresolved in dry-run mode.
- One-command onboarding: `npm run mobile:one-event-onboarding` blocked the old replay fixture, restored the cached Spain vs. France live-runtime event without provider quota, ran the readiness gate, runtime status, settlement readiness, and manual settlement dry run, with S23 connected and no unresolved P0 gaps.

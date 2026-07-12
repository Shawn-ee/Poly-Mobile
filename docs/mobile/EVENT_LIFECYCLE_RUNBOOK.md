# Event Lifecycle Runbook

## Local MVP Lifecycle

| State | Meaning | Current support |
| --- | --- | --- |
| Open / LIVE | Users can quote, buy, sell, and see Portfolio/history. | Supported by `Market.status=LIVE` and existing order routes. |
| Refresh due | Provider quote snapshot is still usable but should refresh. | Surfaced by event detail provider lifecycle fields. |
| Stale | Provider quote snapshot is older than route stale threshold. | Surfaced by event detail provider lifecycle fields. Trading is still governed by market status unless a guard is explicitly added. |
| Suspended / PAUSED | Trading disabled near event start or manually. | `runOneEventLifecycleScheduler` can set `Market.status=PAUSED` inside the pre-start suspend window; admin pause route also exists. |
| Closed | Trading disabled at/after event start or manually. | `runOneEventLifecycleScheduler` can set `Market.status=CLOSED` and cancels open orders; admin close route also exists. |
| Settled / resolved | Winning outcome selected and collateral settled. | Admin/manual orderbook resolve route exists. Automatic soccer settlement is not implemented. |

## Operator Steps For One Local Live Event

1. Start Postgres and backend.
2. For the quota-free consolidated readiness pass, run `npm run mobile:one-event-live-readiness`.
3. For only a quota-free restart check, run `npm run mobile:one-event-live-runtime`.
4. To leave local fake-token liquidity available for testers, run `npm run mobile:one-event-live-runtime -- -SeedMaker`.
5. To keep the one-event local runtime warm for repeated internal checks, run `npm run mobile:one-event-live-supervisor -- -MaxIterations 2 -IntervalSeconds 1`. This foreground loop runs data hygiene, runtime/maker refresh, and the safe real-time lifecycle scheduler each cycle.
6. To run the same supervisor as a local hidden background process, run `npm run mobile:one-event-live-supervisor:process -- -Action start -Continuous -MaxIterations 0`.
7. To check that local background supervisor process, run `npm run mobile:one-event-live-supervisor:status`.
8. To stop that local background supervisor process, run `npm run mobile:one-event-live-supervisor:stop`.
9. For a live provider refresh proof, set `THE_ODDS_API_KEY` in the local process environment and run `npm run mobile:one-event-live-runtime:provider`.
10. For a repeated live-provider supervisor, run `npm run mobile:one-event-live-supervisor -- -RunProviderProof -Continuous -MaxIterations 0` only during intentional manual testing; provider refresh is capped by cadence and max proof runs.
11. Confirm the proof reports provider refresh `ready`.
12. Confirm local shifted maker quotes exist.
13. Open mobile and trade the selected event with fake tokens.
14. To prove local lifecycle controls only, run `npm run mobile:one-event-lifecycle-proof`.
15. To run the safe real-time lifecycle scheduler once, run `npm run mobile:one-event-lifecycle-scheduler-run`.
16. To prove local start-time lifecycle automation with temporary event-time mutations and restore, run `npm run mobile:one-event-lifecycle-scheduler-proof`.
17. If provider goes stale, pause/close the market manually until stale-data lifecycle rules are added.
18. Do not settle automatically unless official result input and admin review are added.

## Completion Boundary

This runbook supports internal fake-token testing. It does not approve real-money deployment, automatic settlement, public liquidity, or unattended production bots.

## Latest Lifecycle Proof

- Summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-runtime-summary.redacted.json`
- Restart/runtime launch summary: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-launch-summary.redacted.json`
- Maker seed summary: `docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json`
- Lifecycle controls summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json`
- Lifecycle scheduler summary: `docs/mobile/harness/odds-api-live-runtime/event-lifecycle-scheduler-summary.redacted.json`
- Safe lifecycle scheduler run summary: `docs/mobile/harness/odds-api-live-runtime/one-event-lifecycle-scheduler-run-summary.redacted.json`
- Consolidated readiness summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-readiness-summary.redacted.json`
- Supervisor summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-summary.redacted.json`
- Supervisor process summary: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-process-summary.redacted.json`
- S23 visible proof: `docs/mobile/harness/cycle-LIVEODDSS23-odds-api-live-runtime-s23/cycle-LIVEODDSS23-odds-api-s23-visible-flow.json`
- Open state: selected market was `LIVE`, visible on Home, visible on Event Detail, and accepted fake-token orders.
- Stale state: proof forced selected quote snapshots stale and Event Detail reported stale provider quote lifecycle.
- Refreshed state: live Odds API refresh restored selected quote lifecycle to ready.
- Closed state: temporarily setting the selected market to `CLOSED` caused order placement to fail with `MARKET_UNAVAILABLE`.
- Lifecycle controls proof: selected market accepted an order in `LIVE`, rejected orders in `PAUSED` and `CLOSED`, produced a non-mutating settlement preview, and restored the market to its original state.
- Lifecycle scheduler proof: selected event had no action outside the suspend window, paused markets inside the suspend window, closed markets after event start, rejected orders in paused/closed states, restored event/market status, and reseeded local maker quotes.
- Settlement readiness: manual settlement preview/resolve service exists, but automatic soccer result ingestion and automatic settlement remain P1.

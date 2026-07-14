# Cycle ZBQ - Local Runtime Warm Start

Date: 2026-07-14

Scope: start and prove the no-quota local internal tester runtime loops for the backend-owned Spain vs. France event.

## Event

- Event: Spain vs. France
- Local slug: `odds-api-single-soccer-test`
- Selected proof market: `Spain vs. France: Total Goals 2.5`
- Selected proof outcome: `Over 2.5`
- Mobile trading mode: fake-token local trading
- Provider quota used by this cycle: no

## Runtime Action

Ran the cached internal tester runtime manager:

`npm run mobile:internal-tester-runtime:cached-start`

The manager reused the already-running backend and Expo listeners, then started:

- One-event live supervisor as a continuous local foreground/background process.
- One-event result poller as a continuous local foreground/background process.

Both loops are local process-manager loops, not installed OS services.

The first readiness summary exposed a confusing split: `allLoopsRunning` was true, but the top-level cached readiness flags were false because the status route separates live mobile-odds freshness from cached internal testing. This cycle tightened the tester-facing summaries so they now report:

- Cached trading readiness: true when both local loops are running and no quota-spending loop is active.
- Live odds readiness: false until mobile-visible provider snapshots are refreshed through the explicit quota-gated command.
- Route-level warm runtime: still reported separately as `routeWarmNoQuotaRuntime` for debugging.

## Evidence

- Supervisor process status: `docs/mobile/harness/odds-api-live-runtime/one-event-live-supervisor-process-summary.redacted.json`
- Result-poller process status: `docs/mobile/harness/odds-api-live-runtime/one-event-result-poller-process-summary.redacted.json`
- Runtime status: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`

## Acceptance Results

| Requirement | Result |
| --- | --- |
| Backend health on port 3002 | Pass |
| Postgres/Docker health | Pass |
| Supervisor process running | Pass |
| Result-poller process running | Pass |
| Runtime status reports all loops running | Pass |
| Runtime status reports no quota-spending loop | Pass |
| Runtime status reports local tester ready right now | Pass |
| Selected market quote route healthy | Pass |
| Selected outcome bid visible | Pass |
| Selected outcome ask visible | Pass |
| Readiness gate cached trading ready | Pass |
| Readiness gate live odds ready stays false without provider refresh | Pass |

## Runtime Truth

- `currentLoopsRunningNow`: true
- `currentLoopsQuotaSpending`: false
- `marketMakerContinuousWhileSupervisorRuns`: true
- `lifecycleSchedulerContinuousWhileSupervisorRuns`: true
- `resultPollerContinuousWhileRunnerRuns`: true
- `installedUnattendedService`: false
- `cachedTradingReady`: true
- `liveOddsReady`: false
- `providerSnapshotFresh`: false under the 90-second mobile display window

## Validation

- `npx jest --runInBand src/__tests__/mobile.the-odds-api-single-event.contract.test.ts` - pass.
- `npm run mobile:internal-tester-readiness-gate` - pass.
- Secret scan over changed runtime proof files and audit docs - pass.

## Remaining Gaps

- P0: none for local internal tester runtime warm start.
- P1: this is still a local process-manager runtime, not an installed unattended OS service.
- P1: official-result live ingestion and active-event settlement remain opt-in/guarded.
- P1: the reused Expo listener is external and server-mode could not be reverified by the runtime manager; replace Expo if the phone shows stale UI.
- P2: multi-event production supervision remains future work.

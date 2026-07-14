# Cycle ZCB - Warm Runtime Current Proof

## Scope

Start and prove the current no-quota internal tester runtime is warm for the Spain vs. France one-event pipeline.

This cycle uses the local runtime manager and does not call The Odds API, spend provider quota, execute settlement, or change mobile UI/backend schema.

## Actions

1. Checked current runtime status: backend and Postgres healthy, Expo listening, S23 disconnected, supervisor/result-poller stopped.
2. Started cached no-quota runtime:
   - `npm run mobile:internal-tester-runtime -- -Action start -StartSupervisor -StartResultPoller -RunResultIngestion -RunResultSettlement -WaitForReady -AllowDisconnectedS23 -RuntimeOnlyArtifacts`
3. Ran the readiness gate while the loops were warm:
   - `npm run mobile:internal-tester-readiness-gate`

## Evidence

- Runtime manager start passed.
- Supervisor process started and was observed running.
- Result-poller process started and was observed running.
- `GET /api/internal/live-runtime/status` reported `currentRuntimeState.mode=warm_no_quota_runtime`.
- `internal-tester-readiness-gate-summary.redacted.json` reported:
  - `pass=true`
  - `testerReady.routeWarmNoQuotaRuntime=true`
  - `testerReady.allLoopsRunning=true`
  - `testerReady.quotaSpendingLoopRunning=false`
  - `checks.internalExchangeReady=true`
  - `testerReady.cachedTradingReady=true`
  - `testerReady.liveOddsReady=false`
  - `gaps.p0=[]`

## Acceptance Result

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| ZCB-P0-01 | P0 | Backend and Postgres healthy before warm proof. | Pass |
| ZCB-P0-02 | P0 | Supervisor and result-poller are running during the proof. | Pass |
| ZCB-P0-03 | P0 | No provider quota-spending loop is running. | Pass |
| ZCB-P0-04 | P0 | Source-aware sportsbook exchange readiness remains true. | Pass |
| ZCB-P0-05 | P0 | Readiness gate has 0 P0 gaps. | Pass |

## Remaining Gaps

- P1: S23 is still not connected through ADB, so this is not a new phone UI proof.
- P1: live mobile odds freshness remains false until the explicit provider-secret refresh runs.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains guarded and incomplete.
- P2: multi-event provider polling/dashboard remains future work.

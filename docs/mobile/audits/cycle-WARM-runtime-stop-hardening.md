# Cycle WARM - Runtime Stop Hardening

## Scope

Refresh and harden the local warm-runtime proof for the one-event internal tester pipeline.

This cycle does not change mobile UI, provider schema, order logic, portfolio logic, or real-money behavior. It targets local runtime hygiene for the existing Spain vs. France internal tester event.

## Changed User-Visible Flow

None directly. The user-visible internal tester flow remains:

Home -> Spain vs. France -> Event Detail -> line market -> ticket -> fake-token order -> Portfolio/history/cashout.

The supporting runtime flow is stronger because local supervisor/result-poller proof now starts both loops, observes them running, and stops them cleanly.

## Scripts Touched

- `scripts/manage_holiwyn_one_event_live_supervisor.ps1`
- `scripts/manage_holiwyn_one_event_result_poller.ps1`

Both process managers now treat `taskkill` child-process race output as non-fatal only when the target parent process is confirmed stopped afterward. If the target process is still running, the command still fails.

## API And Runtime Dependencies

- `GET /api/internal/live-runtime/status`
- `GET /api/health`
- Local Postgres through the existing backend runtime
- `.runtime/one-event-live-supervisor/supervisor-process-state.json`
- `.runtime/one-event-result-poller/result-poller-process-state.json`

No provider API call is made by this proof. Odds API quota is not spent.

## Evidence

- Warm runtime proof: `docs/mobile/harness/odds-api-live-runtime/current-runtime-state-proof-summary.redacted.json`
- Runtime status: `docs/mobile/harness/odds-api-live-runtime/one-event-runtime-status-summary.redacted.json`
- Phase audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`
- Completion audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`

## Result

Pass.

The refreshed warm-runtime proof reports:

- `warmNoQuotaRuntimeObserved=true`
- `allLoopsRunningObserved=true`
- `quotaSpendingLoopRunning=false`
- `providerQuotaUsed=false`
- `stopsLoopsAfterProof=true`
- `p0=[]`

The runtime status, phase audit, and completion audit also passed with no P0 gaps.

## Remaining Gaps

- P0: none for local warm-runtime proof and cleanup.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains open and guarded by exact confirmation plus `CLOSED` market status.
- P2: multi-event warm-runtime orchestration remains future work.

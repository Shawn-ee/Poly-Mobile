# Cycle ZAY - Graceful Runtime Worker Stop

## Scope

Improve the local runtime process managers so normal operator stop actions do not force-kill the supervisor/result-poller and leave misleading failed durable runtime evidence.

## Problem

The previous manager stop path used `taskkill /F` immediately. If a continuous worker was stopped while it was launching a child command or writing a heartbeat, the worker could persist a failed `RuntimeServiceRun` row even though the stop was operator-requested.

That failure mode already caused `npm run mobile:internal-tester-readiness-gate` to fail on `durableRuntimeRunsKnown` until a new bounded proof was run.

## Implementation

Added a local stop-request file to the process-managed workers:

- supervisor stop request: `.runtime/one-event-live-supervisor/stop-request.json`
- result-poller stop request: `.runtime/one-event-result-poller/stop-request.json`

The process managers now:

1. Write the stop-request file on `-Action stop`.
2. Wait briefly for the worker to exit cleanly.
3. Report `operation.graceful=true` when the worker exits on its own.
4. Fall back to force stop only if the worker ignores the request.

The workers now:

1. Remove stale stop-request files on startup.
2. Check the stop-request file before each new cycle.
3. Use a stop-aware sleep wait between cycles.
4. Exit with a passing summary/run record when the stop is graceful.

## Proof

No provider quota was used and no active settlement execution occurred.

Commands:

```text
npm run mobile:one-event-live-supervisor:stop
npm run mobile:one-event-live-supervisor:process -- -Action start -Continuous -MaxIterations 0 -IntervalSeconds 2 -Force
npm run mobile:one-event-live-supervisor:stop
npm run mobile:one-event-result-poller:process -- -Action start -Continuous -MaxIterations 0 -IntervalSeconds 2 -Force
npm run mobile:one-event-result-poller:stop
npm run mobile:internal-tester-readiness-gate
npx tsc --noEmit --pretty false --incremental false
npm --prefix mobile run typecheck
npm run test:ci
```

Results:

- Fresh patched supervisor stop: `operation.result=stopped`, `operation.graceful=true`, `pass=true`.
- Fresh patched result-poller stop: `operation.result=stopped`, `operation.graceful=true`, `pass=true`.
- Internal tester readiness gate: pass, zero P0 gaps, provider quota used by gate: false.
- Root typecheck: pass.
- Mobile typecheck: pass.
- Jest CI suite: pass, 35 suites / 177 tests.

## User-Visible Impact

No mobile UI changed. This improves the reliability of the local internal tester runtime controls behind the existing mobile flow:

Home -> Spain vs. France -> Event Detail -> line market -> Buy -> Portfolio -> Cashout/Sell -> History.

Operators can stop local runtime loops without causing false failed run evidence during normal shutdown.

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| Installed unattended provider/maker/lifecycle service ownership | P1 | Still not claimed; local foreground/background workers are proven only while started. |
| Production official-result auto-settlement | P1 | Still guarded by closed-market status and exact confirmation. |
| Multi-event provider polling/dashboard | P2 | Out of current one-event local MVP scope. |

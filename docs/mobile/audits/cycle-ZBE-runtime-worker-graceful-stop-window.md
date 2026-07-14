# Cycle ZBE - Runtime Worker Graceful Stop Window

## Scope

Improve local one-event runtime worker shutdown reliability for the internal tester environment.

This cycle does not change mobile UI, backend routes, schema, provider refresh behavior, order placement, market contracts, or settlement execution.

## Problem

The result-poller process manager previously waited only 25 seconds for a graceful stop before falling back to `taskkill /F`.

That is too short when a local worker is in the middle of a child proof command. A force stop can prevent the worker from writing a clean worker-owned `RuntimeServiceRun` row, which can later make the readiness gate fail on `durableRuntimeRunsKnown`.

The same hardcoded graceful-stop timeout existed in the one-event supervisor manager.

## Change

Both local worker managers now use the existing `-WaitSeconds` parameter for graceful stops, with a 25-second minimum:

- `scripts/manage_holiwyn_one_event_result_poller.ps1`
- `scripts/manage_holiwyn_one_event_live_supervisor.ps1`

This keeps the default graceful window at 60 seconds and allows longer explicit waits without changing runtime behavior or provider usage.

## Proof

Started bounded background workers, then stopped them through the normal manager stop path:

```text
npm run mobile:one-event-live-supervisor:process -- -Action start -MaxIterations 5 -IntervalSeconds 15
npm run mobile:one-event-result-poller:process -- -Action start -MaxIterations 5 -IntervalSeconds 15
npm run mobile:one-event-live-supervisor:stop
npm run mobile:one-event-result-poller:stop
```

Result:

- Supervisor stop: `operation.result=stopped`, `operation.graceful=true`.
- Result poller stop: `operation.result=stopped`, `operation.graceful=true`.
- No provider quota used.
- No active settlement execution.
- Backend and Expo were left running for S23 testing.

Then refreshed bounded no-quota worker summaries and readiness evidence:

```text
npm run mobile:one-event-live-supervisor -- -MaxIterations 2 -IntervalSeconds 0 -SkipSleep
npm run mobile:one-event-result-poller-proof
npm run mobile:internal-tester-readiness-gate
```

Result:

- Internal tester readiness gate: pass.
- P0 gaps: none.
- Provider quota used by gate: false.

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| Installed unattended provider/maker/lifecycle service ownership | P1 | Still not claimed. Local workers are proven only while started. |
| Production official-result auto-settlement | P1 | Still guarded by `CLOSED` market status and exact confirmation. |
| Multi-event provider polling/dashboard | P2 | Future work. |

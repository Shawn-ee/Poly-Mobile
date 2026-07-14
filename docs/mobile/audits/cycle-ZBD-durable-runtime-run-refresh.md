# Cycle ZBD - Durable Runtime Run Refresh

## Scope

Refresh the no-quota internal tester readiness gate after the current audit found a real P0 gap: `durableRuntimeRunsKnown`.

This cycle did not change mobile UI, backend routes, schema, provider refresh behavior, order placement, or settlement execution.

## Actual Behavior

`npm run mobile:internal-tester-readiness-gate` failed because the ordered live-runtime audit could not prove current durable `RuntimeServiceRun` evidence for both local runtime workers.

Observed current process state before repair:

- Backend on port `3002`: running.
- Expo on port `8081`: running.
- Samsung S23: connected and still on Expo Go.
- Local supervisor process state existed, but the process was no longer running.
- Local result-poller process was still running from an earlier warm runtime and had to be stopped.

## Repair / Proof

Stopped only the local supervisor/result-poller workers, leaving backend and Expo running for the phone:

```text
npm run mobile:one-event-live-supervisor:stop
npm run mobile:one-event-result-poller:stop
```

Then ran bounded no-quota worker proofs:

```text
npm run mobile:one-event-live-supervisor -- -MaxIterations 2 -IntervalSeconds 0 -SkipSleep
npm run mobile:one-event-result-poller-proof
```

Both passed and wrote fresh worker-owned `RuntimeServiceRun` rows without provider quota.

Finally reran:

```text
npm run mobile:internal-tester-readiness-gate
```

Result:

- Readiness gate: pass.
- Provider quota used by gate: false.
- P0 gaps: none.
- Cached trading readiness: pass.
- Current warm loops: false, because the proof workers were intentionally stopped after refresh.

## User-Visible Impact

No visible mobile behavior changed. The S23 cashout screen remained available through the running Expo/backend session.

Tester truth is now clearer:

- Cached internal trading is ready.
- Background supervisor/result-poller capability is proven.
- The loops are not currently running after cleanup.
- To start them again, use the documented cached internal testing/runtime command.

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| Installed unattended provider/maker/lifecycle service ownership | P1 | Still not claimed. Local workers are proven only while started. |
| Production official-result auto-settlement | P1 | Still guarded by `CLOSED` market status and exact confirmation. |
| Multi-event provider polling/dashboard | P2 | Future work. |

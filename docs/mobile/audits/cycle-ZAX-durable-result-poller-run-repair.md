# Cycle ZAX - Durable Result Poller Run Repair

## Scope

Repair the current no-quota internal tester readiness gate after it failed on `durableRuntimeRunsKnown`.

## Actual Behavior

`npm run mobile:internal-tester-readiness-gate` refreshed the ordered live-runtime audit and failed because the latest durable `RuntimeServiceRun` row for `local:one-event-result-poller` was marked `failed`.

The failed row came from a long-running local result-poller process that completed hundreds of no-quota fixture replay cycles, then ended while writing a worker heartbeat. The latest summary showed:

- `pass=false`
- `completedIterations=767`
- P0: `Failed to write worker-owned result-poller runtime heartbeat.`
- provider quota used: false
- active tester settlement execution: false

## Expected Behavior

The completion gate must only pass when the latest durable worker-owned run rows for both local runtime services are passed:

- `local:one-event-live-supervisor`
- `local:one-event-result-poller`

The gate should not treat a stale failed worker row as healthy.

## Fix / Proof Action

Ran a bounded no-quota result-poller proof:

```text
npm run mobile:one-event-result-poller-proof
```

This produced a newer passed `RuntimeServiceRun` row for `local:one-event-result-poller`:

- `pass=true`
- `completedIterations=2`
- provider quota used: false
- active tester settlement execution: false
- installed OS service: false

Then reran:

```text
npm run mobile:internal-tester-readiness-gate
```

Result:

- ordered live-runtime audit: pass
- operator snapshot: pass
- readiness gate: pass
- P0 gaps: none
- provider quota used by gate: false

## User-Visible Impact

No mobile UI changed. The internal tester flow remains:

Home -> Spain vs. France -> Event Detail -> Total Goals 2.5 -> Buy -> Portfolio -> Cashout/Sell -> History.

The gate now correctly reports cached trading ready while also saying the warm background loops are not both running right now. Operators should start the runtime when needed with the documented no-quota command instead of assuming a stopped proof loop is still live.

## Remaining Gaps

| Gap | Priority | Status |
| --- | --- | --- |
| Installed unattended provider/maker/lifecycle service ownership | P1 | Still not claimed. Local foreground/background loops are proven only while started. |
| Production official-result auto-settlement | P1 | Still guarded by closed-market status and exact confirmation. |
| Multi-event provider polling/dashboard | P2 | Out of current one-event local MVP scope. |

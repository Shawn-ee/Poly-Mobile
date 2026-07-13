# Cycle ZX - Lifecycle Scheduler Timing Proof

## Scope

Read-only lifecycle scheduler output hardening for the current Spain vs. France internal tester event.

This cycle does not change mobile UI, provider refresh, order placement, market-maker behavior, schema, or settlement execution.

## Problem

The runtime status route now exposes selected-event lifecycle timing and lifecycle-aware operator actions. The lifecycle scheduler command itself still returned only a compact `action` and `reason`, which made the scheduler artifact less useful than the status route for proving why a run paused, closed, or did nothing.

## Implementation

- `runOneEventLifecycleScheduler` now returns a `timing` block with:
  - `tradingWindow`
  - `pauseAt`
  - `closeAt`
  - `secondsUntilStart`
  - `secondsUntilPause`
  - `nextLifecycleAction`
  - `nextLifecycleActionAt`
  - `secondsUntilNextLifecycleAction`
  - `operatorNextAction`
- The scheduler result now includes event status/live status, candidate market status counts, and `mutationApplied`.
- Missing-event results also include the same timing shape.

## Proof

- Focused contract test: `npx jest --runInBand src/__tests__/mobile.the-odds-api-single-event.contract.test.ts`
- Root typecheck: `npx tsc --noEmit --pretty false --incremental false`
- Dry-run local scheduler proof: `docs/mobile/harness/odds-api-live-runtime/zx-lifecycle-scheduler-timing-summary.redacted.json`

## Route/Runtime Evidence

Latest dry-run scheduler proof reported:

- Event: Spain vs. France
- Event slug: `odds-api-single-soccer-test`
- Trading window: `pre_start_open`
- Scheduler action now: `none`
- Next lifecycle action: `pause`
- Next lifecycle action at: `2026-07-14T18:55:00.000Z`
- Candidate mobile-tradable markets: 3
- Candidate status counts: `LIVE=3`
- Mutation applied: false
- Provider quota used: false
- Active settlement execution attempted: false
- P0 gaps: none

## Remaining Gaps

| Priority | Gap |
| --- | --- |
| P0 | None introduced. |
| P1 | Installed unattended provider/maker/lifecycle service ownership remains open. |
| P1 | Production official-result auto-settlement remains guarded by closed-market status and exact confirmation. |
| P2 | Multi-event provider polling and production operator UI remain future work. |

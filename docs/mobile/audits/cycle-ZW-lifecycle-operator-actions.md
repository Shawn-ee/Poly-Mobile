# Cycle ZW - Lifecycle-Aware Operator Actions

## Scope

Read-only runtime operator guidance for the current Spain vs. France internal tester event.

This cycle does not change mobile UI, provider refresh, order placement, market-maker behavior, schema, or settlement execution.

## Problem

Cycle ZV exposed selected-event lifecycle timing in `/api/internal/live-runtime/status`, but operator next actions still prioritized generic cached testing unless provider snapshots needed refresh. When the event enters the pre-start suspend window or passes kickoff, the status route should recommend the lifecycle scheduler first.

## Implementation

- `operatorNextActions` now reads `selectedEventLifecycle.schedulerActionNow`.
- If the event is inside the suspend window, the recommended first action becomes `run_lifecycle_pause`.
- If the event start time has passed, the recommended first action becomes `run_lifecycle_close`.
- Both actions point to `npm run mobile:one-event-lifecycle-scheduler-run`.
- The actions are local-only, require no provider key, spend no provider quota, and do not execute settlement.
- The normal pre-start/open event state still recommends cached internal testing.

## Proof

- Focused service test: `npx jest --runInBand src/__tests__/liveRuntimeStatus.service.test.ts`
- Root typecheck: `npx tsc --noEmit --pretty false --incremental false`
- Live local route proof: `docs/mobile/harness/odds-api-live-runtime/zw-lifecycle-operator-action-status.redacted.json`

## Route Evidence

Latest local route proof reported:

- Event: Spain vs. France
- Trading window: `pre_start_open`
- Event lifecycle action: `none`
- Recommended first action: `cached_internal_testing`
- Provider quota used by proof: false
- Active settlement execution attempted: false
- P0 gaps: none

The focused test suite additionally covers:

- `pre_start_suspend_window` -> recommends `run_lifecycle_pause`
- `past_start` -> recommends `run_lifecycle_close`

## Remaining Gaps

| Priority | Gap |
| --- | --- |
| P0 | None introduced. |
| P1 | Installed unattended provider/maker/lifecycle service ownership remains open. |
| P1 | Production official-result auto-settlement remains guarded by closed-market status and exact confirmation. |
| P2 | Multi-event provider polling and production operator UI remain future work. |

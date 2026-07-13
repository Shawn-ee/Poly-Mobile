# Cycle ZV - Selected Event Lifecycle Status

## Scope

Read-only backend/runtime status hardening for the current internal tester event, Spain vs. France.

This cycle does not change mobile UI, provider refresh, order placement, settlement execution, schemas, or market-maker behavior.

## Problem

The internal runtime status already reported whether the runtime proof artifacts, provider snapshots, S23 proof, local loops, settlement queue, and service ownership evidence were healthy. It did not query the selected backend event row to say whether the event was still pre-start/open, inside the pre-start suspend window, or past start and ready for lifecycle close handling.

That made lifecycle status too indirect for internal testers.

## Implementation

- Added read-only selected event lifecycle projection to `GET /api/internal/live-runtime/status`.
- The route now queries the selected event slug from the completion/phase audit evidence.
- It reports:
  - event id/slug/title/status/liveStatus
  - provider/source identity
  - start time
  - seconds until start
  - 5-minute suspend window
  - `tradingWindow`
  - `schedulerActionNow`
  - `operatorNextAction`
- If the selected event is missing from the DB, runtime status becomes `needs_attention` with P0 gap `selected_event_missing_from_db`.

## Proof

- Focused service test: `npx jest --runInBand src/__tests__/liveRuntimeStatus.service.test.ts`
- Root typecheck: `npx tsc --noEmit --pretty false --incremental false`
- Live local route proof: `docs/mobile/harness/odds-api-live-runtime/zv-selected-event-lifecycle-status.redacted.json`

## Route Evidence

Latest local route proof reported:

- Route: `GET /api/internal/live-runtime/status`
- Event: Spain vs. France
- Event slug: `odds-api-single-soccer-test`
- Start time: `2026-07-14T19:00:00.000Z`
- Trading window: `pre_start_open`
- Scheduler action now: `none`
- Operator next action: `keep_trading_available_until_suspend_window`
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

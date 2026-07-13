# Cycle ZY - Operator Snapshot Lifecycle Handoff

## Scope

Read-only internal tester operator snapshot for the current Spain vs. France event lifecycle.

This cycle does not change mobile UI, provider refresh, order placement, market-maker behavior, schema, or settlement execution.

## Problem

The runtime status route and lifecycle scheduler now expose event lifecycle timing, but the compact internal tester snapshot did not surface that timing in the tester checklist. A tester/operator still had to inspect the broad status JSON to know whether the event should keep trading, pause, or close.

## Implementation

- `npm run mobile:internal-tester-operator-snapshot` now includes:
  - `selectedEventLifecycle`
  - `operatorNextActions.eventLifecycleAction`
  - `operatorNextActions.eventLifecycleWindow`
  - `operatorNextActions.eventLifecycleOperatorAction`
- The tester checklist now includes an `Event lifecycle timing` row.
- The snapshot derives the next lifecycle action timestamp from `Event.startTime` and the 5-minute suspend window when the status route is still in the open window.

## Proof

- Focused contract test: `npx jest --runInBand src/__tests__/mobile.the-odds-api-single-event.contract.test.ts`
- Root typecheck: `npx tsc --noEmit --pretty false --incremental false`
- No-quota operator snapshot: `docs/mobile/harness/odds-api-live-runtime/zy-operator-snapshot-lifecycle.redacted.json`

## Evidence

Latest snapshot reported:

- Event: Spain vs. France
- Trading window: `pre_start_open`
- Recommended command: `npm run mobile:one-event-onboarding`
- Lifecycle checklist next action: `pause`
- Lifecycle checklist next action at: `2026-07-14T18:55:00.000Z`
- Provider quota used by report: false
- Active settlement execution attempted: false
- P0 gaps: none

## Remaining Gaps

| Priority | Gap |
| --- | --- |
| P0 | None introduced. |
| P1 | Installed unattended provider/maker/lifecycle service ownership remains open. |
| P1 | Production official-result auto-settlement remains guarded by closed-market status and exact confirmation. |
| P2 | Multi-event provider polling and production operator UI remain future work. |

# Cycle ZW3 - Readiness Contract Split

## Scope

Clarify the local runtime readiness contract for the current `Spain vs. France` internal tester flow. No mobile UI, provider import, order route, schema, or production service ownership changed.

## Issue Found

The runtime was warm and cached trading was usable, but the operator/readiness summary still reported `localTesterReadyRightNow=false` whenever mobile-visible provider snapshots were stale. That made cached internal testing look unavailable even though the no-quota supervisor/result-poller loops were running and the selected market had quote liquidity.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| ZW3-P0-01 | P0 | Runtime status distinguishes cached internal tester readiness from live odds freshness. | Pass |
| ZW3-P0-02 | P0 | `localTesterReadyRightNow` is true when warm no-quota local loops are running, even if live mobile odds are stale. | Pass |
| ZW3-P0-03 | P0 | `liveOddsReadyRightNow` remains false when mobile-visible provider snapshots are stale. | Pass |
| ZW3-P0-04 | P0 | Readiness gate remains no-quota and reports no open P0 gaps. | Pass |

## Implementation

- Added `cachedTesterReadyRightNow` and `liveOddsReadyRightNow` to the runtime status contract.
- Kept `testerReadyRightNow`/`localTesterReadyRightNow` aligned with warm no-quota local tester usability.
- Updated the internal tester operator snapshot and readiness gate summaries to expose the split readiness fields.

## Proof

- `npx jest --runInBand src/__tests__/liveRuntimeStatus.service.test.ts src/__tests__/internal.live-runtime.status.route.test.ts src/__tests__/mobile.the-odds-api-single-event.contract.test.ts`: pass.
- `npm run mobile:internal-tester-readiness-gate`: pass.
- Readiness summary now reports:
  - `localTesterReadyRightNow=true`
  - `cachedTesterReadyRightNow=true`
  - `liveOddsReadyRightNow=false`
  - `providerSnapshotFresh=false`
  - `gaps.p0=[]`

## Remaining Gaps

- P1: installed unattended provider/maker/lifecycle service ownership.
- P1: production official-result auto-settlement.
- P2: multi-event provider polling and production dashboard/operator UI.

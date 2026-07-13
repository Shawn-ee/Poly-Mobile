# Cycle ZM - Internal Tester Operator Snapshot

## Scope

Add a no-quota operator snapshot for the current one-event local runtime so internal testers can see the current event, runtime warmth, provider freshness, and the safest next command without digging through the full live-runtime status JSON.

This cycle does not add a daemon, mobile UI, provider scan, order-book work, or settlement execution.

## Acceptance Criteria

| ID | Priority | Criteria | Proof |
| --- | --- | --- | --- |
| ZM-P0-01 | P0 | `npm run mobile:internal-tester-operator-snapshot` reads local backend health and `/api/internal/live-runtime/status`. | Generated snapshot JSON |
| ZM-P0-02 | P0 | The snapshot exposes the recommended operator action/command and states whether it spends provider quota. | Generated snapshot JSON |
| ZM-P0-03 | P0 | The snapshot fails if backend health or runtime status is not ready. | Source contract |
| ZM-P0-04 | P0 | The snapshot does not read or expose `THE_ODDS_API_KEY` and does not call the provider. | Source contract and generated JSON |
| ZM-P1-01 | P1 | The snapshot points testers toward cached internal testing first unless status says live odds need refresh. | Generated snapshot JSON |

## Implementation Notes

- Added `scripts/report_holiwyn_internal_tester_operator_snapshot.ts`.
- Added npm alias `mobile:internal-tester-operator-snapshot`.
- Reused existing status route fields:
  - `runtimeTruth`
  - `currentRuntimeState`
  - `providerSnapshots`
  - `operatorNextActions`
  - `settlementDecision`
  - `serviceOwnership`
- No schema, provider, bot, mobile UI, or order route changes.

## Backend/API Dependencies

| Route | Purpose | Provider quota |
| --- | --- | --- |
| `GET /api/health` | Verify backend and DB health. | No |
| `GET /api/internal/live-runtime/status` | Read current one-event runtime truth and operator actions. | No |

## Audit Result

Pass for the no-quota operator snapshot increment.

- `npm run mobile:internal-tester-operator-snapshot` passed and generated `docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json`.
- Snapshot reports backend health OK and runtime status `ready`.
- Snapshot reports `providerQuotaUsedByThisReport=false`.
- Snapshot reports `currentRuntimeState.mode=proven_capability_loops_stopped`.
- Snapshot reports mobile-visible provider snapshots are stale under the 90-second display window, but the local proof window is still fresh.
- Snapshot recommends `npm run mobile:one-event-onboarding` as the first no-quota operator action.
- Snapshot keeps live provider refresh optional/explicit through `liveOddsAction=refresh_mobile_live_odds`.
- Focused runtime tests passed: `mobile.the-odds-api-single-event.contract`, `liveRuntimeStatus.service`, and `internal.live-runtime.status.route`.
- Root typecheck, mobile typecheck, live-runtime phase audit, live-runtime completion audit, and full Jest CI passed locally.

## Remaining Gaps

- P0: none for this snapshot increment.
- P1: installed unattended service remains open.
- P1: production official-result auto-settlement remains open.

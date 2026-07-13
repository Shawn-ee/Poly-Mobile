# Cycle ZN - Operator Snapshot Audit Gate

## Scope

Make the compact internal tester operator snapshot a required no-quota evidence source for the one-event live-runtime phase/completion audits.

This cycle does not change mobile UI, provider ingestion, order placement, market maker behavior, or settlement execution.

## Acceptance Criteria

| ID | Priority | Criteria | Proof |
| --- | --- | --- | --- |
| ZN-P0-01 | P0 | Phase audit includes `internal-tester-operator-snapshot` as an explicit requirement. | `npm run mobile:one-event-phase-audit` |
| ZN-P0-02 | P0 | Completion audit fails if the operator snapshot is missing, not passing, quota-spending, missing a recommended command, or has P0 gaps. | `npm run mobile:live-runtime-completion-audit` |
| ZN-P0-03 | P0 | Snapshot remains read-only and no-quota. | `npm run mobile:internal-tester-operator-snapshot` |
| ZN-P0-04 | P0 | Source contract prevents removing the gate accidentally. | Focused Jest contract |

## Implementation Notes

- Added `internalTesterOperatorSnapshot` to `scripts/report_odds_api_live_runtime_phase_audit.ts`.
- Added `internalTesterOperatorSnapshot` to `scripts/report_holiwyn_live_runtime_completion_audit.ts`.
- Added completion check `internalTesterOperatorSnapshotKnown`.
- Added source contract expectations in `src/__tests__/mobile.the-odds-api-single-event.contract.test.ts`.

## Backend/API Dependencies

| Route | Purpose | Provider quota |
| --- | --- | --- |
| `GET /api/health` | Health input for the snapshot. | No |
| `GET /api/internal/live-runtime/status` | Runtime/operator action input for the snapshot. | No |

## Audit Result

Pass for the operator snapshot audit-gate increment.

- `npm run mobile:internal-tester-operator-snapshot` passed and regenerated the redacted snapshot.
- Focused source contract passed with the new gate expectations.
- Root typecheck passed.
- `npm run mobile:live-runtime-completion-audit` passed and reports `checks.internalTesterOperatorSnapshotKnown=true`.
- `npm run mobile:one-event-phase-audit` passed and includes requirement `internal-tester-operator-snapshot`.
- Final completion audit passed again after phase audit regeneration.

## Remaining Gaps

- P0: none for this gate increment.
- P1: installed unattended service remains open.
- P1: production official-result auto-settlement remains open.

# Cycle ZCI - Completion Audit Local Persistence Gate

## Scope

Make local runtime persistence part of the top-level live-runtime completion audit instead of leaving it as a standalone capability report. This cycle does not change mobile UI, provider fetches, order placement, schemas, or settlement execution.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| ZCI-P0-01 | P0 | Completion audit reads `runtime-capability-matrix.redacted.json`. | Pass |
| ZCI-P0-02 | P0 | Completion audit fails if the Scheduled Task or Startup launcher capability rows are missing. | Pass |
| ZCI-P0-03 | P0 | Completion audit keeps provider quota usage false. | Pass |
| ZCI-P0-04 | P0 | Regenerated completion audit has zero P0 gaps. | Pass |

## Proof

- `npm run mobile:live-runtime-completion-audit`
  - Output: `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`
  - Result: pass.
  - `checks.runtimeCapabilityMatrixKnown=true`
  - `completionRequirements.runtimeLaunch.pass=true`
  - `gaps.p0=[]`

## Runtime Truth

- Runtime launch completion now requires the capability matrix to document both local persistence options:
  - `local-runtime-scheduled-task`
  - `local-runtime-startup-launcher`
- These remain local internal-testing options. They do not claim production service ownership.

## Gaps

P0: none.

P1:
- Installed production service ownership remains open.
- Production official-result auto-settlement remains guarded by CLOSED market status and exact confirmation.

P2:
- Multi-event provider polling and production dashboard/operator UI remain future work.

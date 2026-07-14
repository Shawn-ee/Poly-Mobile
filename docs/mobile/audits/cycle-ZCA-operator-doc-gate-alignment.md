# Cycle ZCA - Operator Doc Gate Alignment

## Scope

Align human-facing operator docs with the current internal tester readiness gate.

The gate now runs:

1. Ordered live-runtime audit.
2. Source-aware sportsbook exchange readiness.
3. Operator snapshot/checklist.

This cycle does not change backend routes, mobile UI, provider refresh, market maker logic, settlement logic, schemas, or runtime processes.

## Reason

After Cycle ZBZ, the readiness gate became stricter, but some operator docs still described the gate as only runtime audit plus operator snapshot. The docs also implied the cached supervisor/result-poller loops were running in the current snapshot, even though current status can pass cached internal trading after proof cleanup while those loops are stopped.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| ZCA-P0-01 | P0 | Runbook names the three-stage tester readiness gate. | Pass |
| ZCA-P0-02 | P0 | Completion matrix cites source-aware exchange readiness as part of tester handoff evidence. | Pass |
| ZCA-P0-03 | P0 | Operator handoff explains cached readiness can pass while loops are stopped, and tells operators how to start warm loops. | Pass |
| ZCA-P0-04 | P0 | No provider quota, secrets, runtime mutation, or S23 proof is required for this doc-only alignment. | Pass |

## Proof

- Current probe: `npm run mobile:internal-tester-readiness-gate -- --summaryPath docs/mobile/harness/odds-api-live-runtime/current-readiness-probe.redacted.json`
- Result observed: pass, `checks.internalExchangeReady=true`, `testerReady.cachedTradingReady=true`, `testerReady.liveOddsReady=false`, `testerReady.allLoopsRunning=false`, and `gaps.p0=[]`.

The probe output was not committed because it only refreshed timestamped runtime summaries. The committed proof remains the redacted gate summary from Cycle ZBZ.

## Remaining Gaps

- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains guarded and incomplete.
- P2: multi-event provider polling/dashboard remains future work.

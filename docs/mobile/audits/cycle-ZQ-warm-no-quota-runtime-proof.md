# Cycle ZQ - Warm No-Quota Runtime Proof

## Scope

Prove the current internal tester runtime can be warmed locally without provider quota, with the supervisor and result poller both running at the same time, then stop only the manager-owned loop processes for repo/process hygiene.

## Acceptance Criteria

| ID | Priority | Criterion | Proof |
| --- | --- | --- | --- |
| ZQ-P0-01 | P0 | Cached internal tester runtime starts supervisor and result poller without provider quota. | `internal-tester-runtime-manager-summary.redacted.json` start output and `one-event-runtime-status-summary.redacted.json` |
| ZQ-P0-02 | P0 | Runtime status observes both loops running and no quota-spending loop. | `currentManagedProcesses.allLoopsRunning=true`; `quotaSpendingLoopRunning=false` |
| ZQ-P0-03 | P0 | Local market maker path refreshes shifted maker liquidity while the supervisor runs. | `shifted-maker-seed-summary.redacted.json`; quote route in runtime status |
| ZQ-P0-04 | P0 | Result ingestion and trusted-result settlement scheduling run in replay/dry-run mode only. | result ingestion and settlement run summaries |
| ZQ-P0-05 | P0 | Cleanup stops only manager-owned supervisor/result-poller loops and leaves backend/Expo untouched. | `internal-tester-runtime-manager-summary.redacted.json` stop summary |
| ZQ-P1-01 | P1 | Mobile-display provider odds remain stale because `THE_ODDS_API_KEY` is not present in the process environment. | status/operator snapshot |
| ZQ-P1-02 | P1 | Installed unattended service ownership remains open. | phase/completion audit gaps |

## Proof Summary

- Started with `npm run mobile:internal-tester-runtime:cached-start`.
- Runtime status passed with `allLoopsRunning=true`, `supervisorRunning=true`, `resultPollerRunning=true`, and `quotaSpendingLoopRunning=false`.
- `npm run mobile:internal-tester-operator-snapshot` passed and reported warm no-quota runtime.
- `npm run mobile:one-event-runtime-status` passed and showed fresh local maker seed evidence plus no installed OS service claim.
- `npm run mobile:one-event-phase-audit` passed.
- `npm run mobile:live-runtime-completion-audit` passed.
- Stopped with `npm run mobile:internal-tester-runtime:stop`; backend and Expo were not stopped because they were external listeners.

## Result

P0 pass for local warm-runtime proof. This narrows the continuous-runtime question for internal testing: market making and result polling are continuous while the local supervisor/result-poller processes run, but no installed production daemon exists. Live provider refresh is still explicit and requires `THE_ODDS_API_KEY`; it was not run in this cycle.


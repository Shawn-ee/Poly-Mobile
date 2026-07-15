# Cycle ZCH - Local Runtime Persistence Capability

## Scope

Narrow the backend live-runtime question from "foreground loops only" to a documented local persistence boundary. This cycle does not change mobile UI, order placement, provider ingestion, schemas, or settlement execution.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| ZCH-P0-01 | P0 | Runtime capability matrix lists supervisor, result poller, one-shot maker/lifecycle, and local persistence options. | Pass |
| ZCH-P0-02 | P0 | Capability report is no-quota and contains no provider secret. | Pass |
| ZCH-P0-03 | P0 | User Startup launcher install/uninstall proof leaves no persistent launcher behind. | Pass |
| ZCH-P0-04 | P0 | Scheduled Task proof records permission truth instead of pretending install succeeded. | Pass |
| ZCH-P0-05 | P0 | No backend route/schema/mobile UI behavior changes are made. | Pass |

## Proof

- `npm run mobile:runtime-capability-matrix`
  - Output: `docs/mobile/harness/odds-api-live-runtime/runtime-capability-matrix.redacted.json`
  - Result: pass.
  - Counts: total 8, ready 5, operator-triggered 3, missing 0, continuous-while-command-runs 2, local persistence options 2.
- `npm run mobile:local-runtime-task:install-proof`
  - Output: `docs/mobile/harness/odds-api-live-runtime/local-runtime-task-install-uninstall-summary.redacted.json`
  - Result: pass with P1 permission boundary.
  - Truth: Windows denied scheduled-task registration in this process context, no persistent task was left installed, and provider quota was not used.
- `npm run mobile:local-runtime-startup:install-proof`
  - Output: `docs/mobile/harness/odds-api-live-runtime/local-runtime-startup-install-uninstall-summary.redacted.json`
  - Result: pass.
  - Truth: user Startup launcher installed and uninstalled cleanly, includes supervisor/result-poller startup, no persistent launcher was left installed, and provider quota was not used.

## Runtime Truth

- Market maker remains continuous while the local supervisor process runs.
- Result polling remains continuous while the local result-poller process runs.
- Windows Scheduled Task is an operator-triggered local persistence option, but actual registration is blocked by current Windows permissions unless run elevated or with task rights.
- User Startup launcher is an operator-triggered local persistence option that works for this user at logon.
- Neither option is a production service, health-monitored daemon, or multi-event runtime.

## Gaps

P0: none.

P1:
- Scheduled Task registration requires elevated/task-registration permission in this Windows context.
- Production service ownership and monitoring remain future work.
- Official-result active-event execution remains guarded by CLOSED market status and exact approval.

P2:
- Multi-event production service supervision remains future work.

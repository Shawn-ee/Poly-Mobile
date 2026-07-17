# Cycle ZCJ - Operator Runtime Status And S23 Gate

## Scope

Correct the backend live-runtime contract, prove safe current-event result handling, harden local process cleanup, and refresh the full physical-device trading gate. The provider event is `Chapecoense vs. Bahia`; no provider refresh quota was spent by the final watchdog/audit runs.

The mobile UI and order API were not redesigned. Harness corrections ensure the existing backend-owned event and close-position ticket are exercised reliably on Samsung S23.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| ZCJ-P0-01 | P0 | `/api/internal/live-runtime/status` reports local guarded operator controls as implemented while keeping production workflow incomplete. | Pass |
| ZCJ-P0-02 | P0 | Completion audit gates on `productionAuthRequirements.version=2` and the new `production_operator_workflow_incomplete` P1 label. | Pass |
| ZCJ-P0-03 | P0 | Operator session reports admin can use guarded local execution capability without exposing exact confirmation strings. | Pass |
| ZCJ-P0-04 | P0 | An active event with no matching final provider result reports `awaiting_result`, excludes historical review rows, and does not manufacture or execute settlement evidence. | Pass |
| ZCJ-P0-05 | P0 | Supervisor and result-poller proofs run without provider quota and both managed cleanup actions pass. | Pass |
| ZCJ-P0-06 | P0 | Samsung S23 proves Home -> Event Detail -> Total Goals 2.5 -> Buy -> Portfolio -> close-position Max -> Sell -> History. | Pass |
| ZCJ-P0-07 | P0 | Cashout Max uses owned shares, hides Yes/No, and never uses wallet balance. | Pass: 43.1 owned shares observed |

## Expected Runtime Truth

- Local guarded operator controls exist:
  - `GET /api/internal/operator/session`
  - `GET /api/internal/live-runtime/result-review`
  - `GET /api/internal/live-runtime/settlement-queue`
  - `POST /api/internal/live-runtime/settlement-queue/:reviewId/approve`
  - `POST /api/internal/live-runtime/settlement-queue/:reviewId/execute`
- Exact-confirmed execution remains local/internal and blocked unless all guards pass:
  - reviewed durable result evidence
  - approval evidence
  - `CLOSED` market status
  - admin or two-person policy
  - operator-held exact confirmation
- Production is still not complete because production UI, dedicated settlement-operator roles, installed official-result polling, installed service ownership, monitoring, and alerting remain open.

## Gaps

P0: none.

P1:
- Production operator UI.
- Dedicated settlement-operator role model.
- Installed official-result polling and service ownership.

P2:
- Production operator dashboard and broader monitoring polish.

## Proof

- S23: `SM-S911U1`, direct wireless endpoint `172.16.200.27:46763`; the established mDNS device identity is `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- Mobile summary: `docs/mobile/harness/cycle-ZCJ-operator-runtime-status/cycle-ZCJ-odds-api-s23-visible-flow.json`.
- Screenshots/XML: `docs/mobile/screenshots/cycle-ZCJ-operator-runtime-status/` and `docs/mobile/harness/cycle-ZCJ-operator-runtime-status/`.
- Watchdog: `docs/mobile/harness/odds-api-live-runtime/internal-tester-watchdog-summary.redacted.json`; repeated supervisor and result-poller proofs passed and cleanup passed.
- Phase audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-phase-audit-summary.redacted.json`; pass, zero P0.
- Completion audit: `docs/mobile/harness/odds-api-live-runtime/live-runtime-completion-audit-summary.redacted.json`; pass, local internal-runtime phase complete, production runtime incomplete.

## Audit Decision

Parity/runtime gate: **Pass for the one-event local internal tester runtime**.

The current event remains open and correctly awaits a matching final provider result. Full production launch remains blocked by the P1 items above; this pass does not claim an installed unattended service or production-safe real-money settlement.

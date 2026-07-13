# Cycle ZP - Operator Snapshot Tester Checklist

## Scope

Strengthen the local internal tester handoff without starting new UI work, spending provider quota, or changing trading logic.

## Acceptance Criteria

| ID | Priority | Criterion | Proof |
| --- | --- | --- | --- |
| ZP-P0-01 | P0 | `npm run mobile:internal-tester-operator-snapshot` still reads only local health/runtime status routes and spends no provider quota. | Snapshot JSON and command pass |
| ZP-P0-02 | P0 | Snapshot includes a generated tester checklist with event, selected market/outcome, launch expectations, Home, Event Detail, Quote/Buy, Portfolio, Cashout/Sell, stale-market, and settlement guard checks. | `testerLaunchChecklist` in snapshot |
| ZP-P0-03 | P0 | Cashout checklist explicitly states Max must use owned shares only and must not show a Yes/No selector. | Snapshot JSON |
| ZP-P0-04 | P0 | Checklist is generated from `/api/internal/live-runtime/status`, not hardcoded proof prose or provider calls. | Script source and contract test |
| ZP-P1-01 | P1 | Installed unattended service ownership remains accurately reported as incomplete. | Snapshot gaps |
| ZP-P1-02 | P1 | Production official-result auto-settlement remains accurately guarded/deferred. | Snapshot gaps |

## Implementation Summary

- Added `testerLaunchChecklist` generation to `scripts/report_holiwyn_internal_tester_operator_snapshot.ts`.
- Checklist records the current Spain vs. France event, selected Total Goals 2.5 market, selected `Over +2.5` outcome, expected mobile flow, and API dependency per step.
- No mobile UI, order route, schema, market maker, or provider ingestion logic changed.

## Proof

- `npm run mobile:internal-tester-operator-snapshot`: pass.
- Snapshot path: `docs/mobile/harness/odds-api-live-runtime/internal-tester-operator-snapshot.redacted.json`.
- Provider quota used: false.
- Remaining gaps: P0 none; P1 installed unattended service ownership and production official-result auto-settlement.


# Cycle ZW2 - Internal Tester Readiness Recovery

## Scope

Keep the current `Spain vs. France` local internal tester flow usable after the S23 buy/cashout proof. No mobile UI, order contract, provider import, schema, or production runtime infrastructure changed.

## Issue Found

The S23 cashout proof passed, but the next readiness gate caught runtime evidence drift:

- The selected `Total Goals 2.5 / Over 2.5` market still had a bid, but the local maker ask was consumed by proof trading.
- The local supervisor and result-poller loops were stopped, so runtime status could not claim a warm tester runtime.
- Result-review and settlement preflight/approval evidence needed to be refreshed for the current selected market/outcome.
- `npm run mobile:internal-tester-operator-snapshot` read `/api/internal/live-runtime/status` without `phaseAuditInProgress=1`, which created a circular failure while the phase audit was regenerating.

## Acceptance Criteria

| ID | Priority | Criteria | Result |
| --- | --- | --- | --- |
| ZW2-P0-01 | P0 | Selected market quote route exposes both visible bid and ask for the current outcome. | Pass |
| ZW2-P0-02 | P0 | Warm no-quota runtime reports supervisor and result-poller running without a quota-spending provider loop. | Pass |
| ZW2-P0-03 | P0 | Result-review, settlement preflight, and approval evidence match the current selected market/outcome. | Pass |
| ZW2-P0-04 | P0 | Operator snapshot passes during readiness gate regeneration and does not call the provider. | Pass |
| ZW2-P0-05 | P0 | Ordered internal tester readiness gate has no open P0 gaps. | Pass |

## Implementation

- Re-seeded local fake-token maker liquidity for the current selected outcome with `npm run mobile:one-event-live-maker-seed`.
- Started the cached internal tester runtime with `npm run mobile:internal-tester-runtime:cached-start`.
- Refreshed no-quota result ingestion, settlement preflight, settlement approval, and result-review trail artifacts.
- Updated `scripts/report_holiwyn_internal_tester_operator_snapshot.ts` so the snapshot reads `/api/internal/live-runtime/status?phaseAuditInProgress=1` while audit artifacts are being regenerated.

## Proof

- `npm run mobile:one-event-live-maker-seed`: pass.
- `npm run mobile:internal-tester-runtime:cached-start`: pass.
- `npm run mobile:one-event-result-ingestion-audit-event-proof`: pass.
- `npm run mobile:one-event-settlement-audit-event-proof`: pass.
- `npm run mobile:one-event-settlement-approval-audit-event-proof`: pass.
- `npm run mobile:one-event-result-review-trail`: pass.
- `npm run mobile:internal-tester-operator-snapshot`: pass.
- `npm run mobile:internal-tester-readiness-gate`: pass.

## Device And Runtime State

- Android device: Samsung S23 `SM_S911U1`, ADB `172.16.200.27:44029`.
- Backend: local listener on port `3002`.
- Expo: local listener on port `8081`.
- Runtime loops: supervisor and result poller running in warm no-quota mode.
- Provider quota: not used by this recovery cycle.

## Remaining Gaps

- P1: installed unattended provider/maker/lifecycle service ownership.
- P1: production official-result auto-settlement.
- P2: multi-event provider polling and production dashboard/operator UI.

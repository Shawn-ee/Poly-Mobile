# Cycle ZBZ - Internal Exchange Readiness Gate Integration

## Scope

Integrate the source-aware sportsbook exchange readiness proof into the local internal tester readiness gate.

This cycle does not change mobile UI, provider refresh logic, order routes, market maker behavior, settlement, or schema. It makes the go/no-go gate stricter and more useful: a green internal tester summary must now prove that the current backend-owned event has mobile-visible provider markets plus at least one local-MM/open-order-backed trading path.

## Acceptance Criteria

| ID | Priority | Criteria | Evidence |
| --- | --- | --- | --- |
| ZBZ-P0-01 | P0 | `npm run mobile:internal-tester-readiness-gate` runs ordered runtime audit before exchange readiness and before operator snapshot. | Readiness gate summary `orderInvariant.requiredOrder` |
| ZBZ-P0-02 | P0 | Gate fails if source-aware sportsbook exchange readiness is not true. | `checks.internalExchangeReady`; P0 gap prefix `internal_exchange:` |
| ZBZ-P0-03 | P0 | Gate remains no-quota and does not read or print provider secrets. | Source contract and summary `providerQuotaUsedByThisGate=false` |
| ZBZ-P0-04 | P0 | Tester summary exposes exchange source, mobile-visible event count, provider market count, snapshot-ready count, local-MM-ready count, and open-order-backed count. | `testerReady.exchangeReadiness` |

## Implementation Notes

- Updated `scripts/run_holiwyn_internal_tester_readiness_gate.ts`.
- Added stage `sportsbook-exchange-readiness`, using existing npm script `mobile:internal-exchange-readiness`.
- Added `testerReady.exchangeReadiness` to the redacted summary.
- Added `checks.internalExchangeReady` and P0 conversion for exchange blockers.
- Updated the existing Jest contract test for the required stage order and output fields.

## Proof Plan

- `npm run mobile:internal-exchange-readiness -- --summaryPath docs/mobile/harness/odds-api-live-runtime/mobile-internal-exchange-readiness-summary.redacted.json`
- `npm run mobile:internal-tester-readiness-gate`
- `npx tsc --noEmit --pretty false --incremental false`
- `npm run test:ci`
- `npm --prefix mobile run typecheck`

## Remaining Gaps

- P1: live odds freshness still requires the explicit quota-gated provider refresh path.
- P1: installed unattended provider/maker/lifecycle service ownership remains open.
- P1: production official-result auto-settlement remains guarded and incomplete.
- P2: multi-event provider polling/dashboard remains future work.

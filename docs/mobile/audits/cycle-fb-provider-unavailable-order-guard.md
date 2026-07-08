# Cycle FB - Provider Unavailable Order Guard

## Scope

Cycle FB closes the backend half of Cycle FA's Local MVP unavailable-state work. FA proved the mobile ticket shows and disables unavailable markets; FB proves a direct API client cannot bypass that mobile guard and submit an order on a provider-backed market with no accepting provider quote.

## Criteria

| Criterion | Priority | Result |
| --- | --- | --- |
| FB-P0-01: Provider-backed markets without an accepting provider quote reject canonical order submission before matching. | P0 | Pass |
| FB-P0-02: Rejected unavailable orders are recorded as failed `ApiOrderRequest` responses for auditability. | P0 | Pass |
| FB-P0-03: Provider-backed markets with accepting quote snapshots remain tradable, so stale-but-quoting markets are not over-blocked. | P0 | Pass |
| FB-P0-04: Non-provider local/test markets keep existing behavior. | P0 | Pass |

## Implementation Notes

- `submitCanonicalOrder` now calls a provider-backed market guard after idempotency/request logging and before matching.
- The guard only applies when a market has provider identity (`referenceSource`, `externalMarketId`, or `conditionId`).
- It requires the selected outcome to have a latest `ReferenceQuoteSnapshot` with `acceptingOrders=true`.
- If no accepting quote exists, the service returns/stores `MARKET_UNAVAILABLE` with HTTP `409`.

## Evidence

- Focused test: `npm run test:jest -- src/server/services/__tests__/canonical_order_submission.phase5.test.ts`
- TypeScript compile: `npx tsc --noEmit`
- Provider status contract support: `docs/mobile/harness/cycle-FB-provider-unavailable-order-guard/proof-provider-status-breadth.json`

## Audit Gate

Pass for backend/provider guard scope.

Unresolved P0 gaps: 0 for selected backend feature.

Remaining P1/P2: production active-event provider breadth and a later end-to-end unavailable order rejection proof through the live mobile API client if the UI ever exposes an unavailable submit path again.

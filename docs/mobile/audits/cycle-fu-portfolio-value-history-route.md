# Cycle FU - Portfolio Value History Backend Route

Status: backend contract pass; visible mobile wiring remains next-cycle work.

## Reference Behavior

Polymarket Portfolio shows a large account value, green/red performance line, and selectable ranges `1D`, `1W`, `1M`, and `All`. The chart must not be a static placeholder once account history data is available.

## Holiwyn Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| FU-P0-01 | P0 | Backend exposes a Portfolio value-history route matching the mobile contract for all range keys. | Pass |
| FU-P0-02 | P0 | Route uses the same account-read auth model as Portfolio. | Pass |
| FU-P0-03 | P0 | Response includes source/status/timestamps and chart points with value, cash, positionsValue, and pnl. | Pass |
| FU-P0-04 | P0 | Invalid range is rejected before account state queries. | Pass |
| FU-P1-01 | P1 | Android Portfolio consumes the route in server mode and proves `source=portfolio-value-history-route`. | Open |
| FU-P1-02 | P1 | Persisted account-value snapshots or ledger replay provide exact historical cash/position quantities. | Open |

## Implementation

- Added `GET /api/portfolio/value-history?range=1D|1W|1M|All`.
- Added `buildPortfolioValueHistory()` service to construct route-shaped points from `UserBalance`, `Position`, and `MarketOutcomeSnapshot`.
- Added focused Jest route coverage for session auth, API-key auth, invalid range handling, and anonymous rejection.

## Proof

- `cmd /c npm.cmd run test:jest -- src/__tests__/portfolio.value-history.route.test.ts`

## Audit Gate

Pass for backend contract only. This cycle does not claim visible Portfolio parity because the standalone mobile UI still uses deterministic fallback chart data until a later wiring/proof cycle.

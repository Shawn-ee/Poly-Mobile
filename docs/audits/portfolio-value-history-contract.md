# Portfolio Value History Contract Audit

## Reference

Polymarket Portfolio shows account value history as a chart controlled by `1D`, `1W`, `1M`, and `All`. Holiwyn previously had a deterministic visual chart and interactive range buttons, but no mobile data contract for replacing that chart with backend history.

## Holiwyn Acceptance Criteria

| Criteria | Priority | Verification |
| --- | --- | --- |
| Mobile defines a backend-shaped Portfolio value history payload. | P0 | Type definitions and API client test. |
| Mobile API client can request `GET /api/portfolio/value-history?range={range}`. | P0 | Unit test. |
| Portfolio chart consumes contract-shaped history state, including range, source, status, and point count. | P0 | Android XML proof. |
| If the backend route is unavailable, deterministic fallback data uses the same contract shape. | P0 | Unit test and Android XML proof. |
| Real backend route/schema exists and returns persisted account history. | P1 | Deferred backend milestone. |

## Cycle FT Result

- Implementation: mobile now defines `PortfolioValueHistory`/`PortfolioValueHistoryPoint`, `PolyApi.getPortfolioValueHistory(range)`, and a deterministic fallback service consumed by the Portfolio chart.
- Backend/API impact: route contract added to mobile docs/client, but backend route is not implemented in the standalone mobile repo.
- Android proof: passed on Samsung tablet with `powershell -ExecutionPolicy Bypass -File ./scripts/smoke-tablet.ps1 -LocalMvpSellFlow -Port 8230`.
- Test proof: `npm run typecheck`; `npx vitest run src/__tests__/api.test.ts src/__tests__/portfolioValueHistoryService.test.ts`.
- Audit status: P0 pass. Remaining P1 gap is the real persisted backend route/schema.

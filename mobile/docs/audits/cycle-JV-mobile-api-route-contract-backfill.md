# Cycle JV - Mobile API Route Contract Backfill

Status: Pass for focused backend/data-contract consolidation scope.

Scope:

- Mobile API client and shared type definitions required by already-gated backend route contracts.
- Event list pagination request/response shape.
- Backend-driven Event Detail market-rule fields on event summaries.
- Portfolio value-history route client and typed response shape.
- Portfolio selection identity fields needed by order/history surfaces.
- No UI redesign and no edits to dirty screen components.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Mobile event-list client can request backend cursor pages | Pass | `mobile/src/__tests__/api.test.ts` and `docs/mobile/harness/cycle-JV-mobile-api-route-contract-backfill/cycle-JV-mobile-api-route-contract-backfill.json`. |
| Mobile event summaries can carry backend market-rule fields | Pass | `mobile/src/types.ts` includes `marketProfile`, `resultMode`, `gameRules`, and `supportedMarketTypes`; proof decodes these fields from the route-shaped response. |
| Mobile client can call portfolio value-history route | Pass | `mobile/src/__tests__/api.test.ts` and JV proof verify `/api/portfolio/value-history?range=1W`. |
| Portfolio route selection identity fields remain typed | Pass | `mobile/src/types.ts` includes `contractSide` and `orderId` fields consumed by Portfolio/history/open-order mappers. |
| The cycle does not bundle unrelated UI churn | Pass | Scoped commit includes only mobile API/types, proof, and docs. |

## Change Notes

- Backfilled mobile client/type route-contract changes that committed tests already expected.
- This makes the branch self-contained for the JR/JQ/value-history route contracts without committing dirty visual files.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/api.test.ts` - pass.
- `npx tsx scripts/prove_mobile_api_route_contract_backfill.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/public.events.no-leak.test.ts src/__tests__/portfolio.value-history.route.test.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle JV"` - pass.

## Remaining P1

- Portfolio value-history UI server-mode wiring remains blocked by dirty `mobile/App.tsx` and `mobile/src/components/Portfolio.tsx` churn.
- Search tab UI server-mode backend pagination remains blocked by dirty Search/App UI files.

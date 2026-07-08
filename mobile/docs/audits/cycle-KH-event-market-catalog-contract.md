# Cycle KH - Event Market Catalog Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile Event Detail/Game Lines can load the full public market catalog from `/api/events/:slug/markets`.
- Route payload preserves market type, period, line, group title, and active outcomes needed by visible line adjustment.
- Backend filters private and unlisted markets.
- No Event Detail visual redesign, order book UI, chat, live stats, deposit, or withdraw work.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Mobile API exposes event market catalog route | Pass | `mobile/src/__tests__/api.test.ts` verifies `getEventMarkets()` calls `/api/events/:slug/markets` with auth and URL encoding. |
| Mobile service prefers backend market route | Pass | `mobile/src/__tests__/eventMarketCatalogService.test.ts` verifies `loadEventMarketCatalog()` loads and normalizes server route markets. |
| Route data preserves Game Lines metadata | Pass | Service tests and proof verify `marketType`, `period`, `line`, and outcomes survive route-to-mobile normalization. |
| Backend filters unsupported rows | Pass | `scripts/prove_mobile_event_market_catalog_contract.ts` verifies private/unlisted markets are not returned. |
| Cycle avoids unrelated UI churn | Pass | No edits to `mobile/App.tsx`, `EventDetail.tsx`, `TradeTicket.tsx`, Portfolio UI, order book UI, chat, live stats, deposit, or withdraw flows. |

## Change Notes

- Added `PolyApi.getEventMarkets(slug)`.
- Added `loadEventMarketCatalog()` as a focused service boundary for visible Event Detail/Game Lines market catalog loading.
- Added a route proof that seeds Spread, Totals, Team Total, private, and unlisted markets, then verifies only public/listed rows normalize into mobile line metadata.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/api.test.ts mobile/src/__tests__/eventMarketCatalogService.test.ts mobile/src/__tests__/marketLineOptionsService.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/public.event-markets.no-leak.test.ts` - pass.
- `npx tsx scripts/prove_mobile_event_market_catalog_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle KH"` - pass.

## Remaining P1

- Wire dirty Event Detail UI files to `loadEventMarketCatalog()` after unrelated screen churn is reconciled.
- Android proof that visible line chips refresh from this route if visual proof becomes required again.

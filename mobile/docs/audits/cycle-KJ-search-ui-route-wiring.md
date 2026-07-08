# Cycle KJ - Search UI Route Wiring

Gate status: Pass

Scope: Backend/data-contract gate for the visible Search tab consuming backend Search pages in server market-data mode. This does not redesign Search and does not add ranked/faceted discovery.

## P0 Checklist

- Search tab server mode uses `/api/events?search=...&includeMobileMarkets=1&limit=...&cursor=...` through `loadSearchEventPage()`.
- Successful backend Search pages drive the visible `SearchScreen` event list instead of filtering only the already-loaded Home event page.
- Search cursor metadata reaches the visible Search tab through `canLoadMoreEvents`, `isLoadingMoreEvents`, and `loadMoreEvents`.
- Mock/offline mode keeps local filtering fallback.
- No order book, chat, live stats, deposit, withdraw, or Portfolio redesign work is included.

## Evidence

- Proof: `docs/mobile/harness/cycle-KJ-search-ui-route-wiring/cycle-KJ-search-ui-route-wiring.json`.
- Proof script: `scripts/prove_mobile_search_ui_route_wiring.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/api.test.ts`
  - `mobile/src/__tests__/searchEventService.test.ts`
- Focused backend tests:
  - `src/__tests__/public.events.no-leak.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Search UI backend route wiring.
- Remaining P1: ranked/faceted discovery only if the MVP Search scope expands; optional Android proof if visual proof becomes required again.

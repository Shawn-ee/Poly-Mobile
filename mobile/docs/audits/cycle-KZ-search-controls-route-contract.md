# Cycle KZ - Search Controls Route Contract

Gate status: Pass

Scope: Backend/data-contract gate for visible Search controls. This cycle removes unsupported local-only Search category/sort controls and keeps the visible Search page focused on backend-backed query, clear, result list, and cursor load-more behavior.

## P0 Checklist

- Search text input remains visible and tied to the app-level query state.
- Server-mode Search still calls `loadSearchEventPage()` with `search`, `limit`, and `cursor`.
- Search result pages still consume `/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1`.
- Search load-more still uses backend cursor metadata.
- Unsupported category chips are not visible.
- Unsupported local-only `Popular` / `Live first` sort controls are not visible.
- Mock/offline mode keeps local fallback filtering only when the backend route is unavailable.

## Evidence

- Proof: `docs/mobile/harness/cycle-KZ-search-controls-route-contract/cycle-KZ-search-controls-route-contract.json`.
- Proof script: `scripts/prove_mobile_search_controls_contract.ts`.
- Focused mobile tests:
  - `mobile/src/__tests__/searchScreenContract.test.ts`
  - `mobile/src/__tests__/searchEventService.test.ts`
  - `mobile/src/__tests__/api.test.ts`
- Focused backend tests:
  - `src/__tests__/public.events.no-leak.test.ts`
- Typechecks:
  - `npm run typecheck --prefix mobile`
  - `npx tsc --noEmit`

## Decision

- P0 failed: 0 for focused Search controls route contract.
- Remaining P1: ranked/faceted discovery only if Search scope expands; optional Android proof if visual proof becomes required again.

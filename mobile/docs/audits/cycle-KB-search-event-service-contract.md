# Cycle KB - Search Event Service Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile service-layer loader for visible Search results.
- Backend `/api/events?search=...&limit=...&cursor=...` use in server mode.
- Compact market rows and cursor pagination preserved through the mobile service.
- No Search visual redesign and no edits to dirty `SearchScreen` or `App` UI files.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Search service prefers backend route pages when an API client is available | Pass | `mobile/src/__tests__/searchEventService.test.ts` verifies `loadSearchEventPage()` calls `listWorldCupEvents({ search, limit, cursor })` and returns `source=server-route`. |
| Search service preserves backend pagination shape | Pass | `scripts/prove_mobile_search_event_service_contract.ts` and proof JSON show first page `hasMore=true` with `nextCursor`, then second page ends pagination. |
| Search service preserves compact market rows from the backend | Pass | `docs/mobile/harness/cycle-KB-search-event-service-contract/cycle-KB-search-event-service-contract.json` proves every returned event includes compact markets. |
| Local filtering is isolated to route-unavailable fallback | Pass | `mobile/src/__tests__/searchEventService.test.ts` covers route failure fallback and local event/team/market/outcome text matching. |
| Cycle avoids unrelated dirty UI churn | Pass | No edits to `mobile/App.tsx` or `mobile/src/components/SearchScreen.tsx`. |

## Change Notes

- Added `loadSearchEventPage()` as the service boundary Search UI can call once dirty screen files are reconciled.
- The service does not invent Search rows when the backend route succeeds.
- Fallback remains backend-shaped and local-only for offline/non-server mode.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/searchEventService.test.ts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/public.events.no-leak.test.ts` - pass.
- `npx tsx scripts/prove_mobile_search_event_service_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle KB"` - pass.

## Remaining P1

- Wire dirty Search UI files to `loadSearchEventPage()` in server mode after the current unrelated UI churn is reconciled.
- Add production ranked/faceted discovery only if World Cup MVP Search scope expands.

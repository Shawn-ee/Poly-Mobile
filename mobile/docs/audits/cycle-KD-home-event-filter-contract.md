# Cycle KD - Home Event Filter Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Mobile Home feed service can request backend event pages by event `status`.
- Backend `/api/events` preserves `status`, cursor, and compact-market behavior for Home-style pages.
- No Home visual redesign and no edits to dirty Home/Live/Search screen files.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Home feed status filters are backend-driven | Pass | `mobile/src/__tests__/homeEventFeedService.test.ts` verifies the mobile service calls `listWorldCupEvents({ status })`. |
| `/api/events` supports filtered compact market pages | Pass | `src/__tests__/public.events.no-leak.test.ts` verifies `status=live&includeMobileMarkets=1` reaches the backend route filter and returns compact markets. |
| Mobile API exposes the route contract | Pass | `mobile/src/__tests__/api.test.ts` verifies `PolyApi.listWorldCupEvents()` sends `status` with compact markets enabled. |
| Route proof covers multiple Home filters | Pass | `scripts/prove_mobile_home_event_filter_contract.ts` seeds live and upcoming events, then proves `loadHomeEventFeedPage()` returns backend-sourced pages for each. |
| Cycle avoids unrelated UI churn | Pass | No edits to `mobile/App.tsx`, `HomeScreen`, `LiveScreen`, `SearchScreen`, order book, chat, deposits, or withdraw flows. |

## Change Notes

- Added `loadHomeEventFeedPage()` as a backend-first Home feed service with local fallback only when the route is unavailable.
- Extended `PolyApi.listWorldCupEvents()` to pass event `status` to `/api/events`.
- Added a focused proof artifact for live/upcoming Home filter pages.

## Validation

- `npx vitest run -c vitest.mobile.config.mts mobile/src/__tests__/homeEventFeedService.test.ts mobile/src/__tests__/api.test.ts` - pass.
- `npx jest --runInBand --detectOpenHandles src/__tests__/public.events.no-leak.test.ts` - pass.
- `npx tsx scripts/prove_mobile_home_event_filter_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `npm run typecheck --prefix mobile` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle KD"` - pass.

## Remaining P1

- Wire dirty Home/Live UI files to `loadHomeEventFeedPage()` in server mode after unrelated mobile UI churn is reconciled.
- Calendar-accurate `today` filtering remains a future route parameter if the product needs a date-window tab instead of event-status tabs.

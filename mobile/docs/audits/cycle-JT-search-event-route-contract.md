# Cycle JT - Search Event Route Contract

Status: Pass for focused backend/data-contract scope.

Scope:

- Backend `/api/events` search matching for the visible mobile Search surface.
- Cursor pagination with compact mobile markets for search results.
- No Search UI redesign and no edits to currently dirty mobile UI files.

## P0 Results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Search query can match event/team text | Pass | `src/__tests__/public.events.no-leak.test.ts` asserts `/api/events` includes title, description, home team, and away team search filters. |
| Search query can match public market and outcome text | Pass | `src/__tests__/public.events.no-leak.test.ts` asserts listed public markets and outcome `name`/`label` participate in backend search. |
| Search results can return compact mobile market rows | Pass | `docs/mobile/harness/cycle-JT-search-event-route-contract/cycle-JT-search-event-route-contract.json` proves `includeMobileMarkets=1` returns compact markets for search results. |
| Search results support cursor pagination | Pass | Same proof shows first page `hasMore=true` with `nextCursor`, then second page ends pagination. |
| Sensitive fields do not leak through search results | Pass | Existing no-leak assertions run against the `/api/events` search response. |

## Change Notes

- `/api/events?search=` now searches event title/description, home/away team names, listed public market title/description, and active outcome name/label.
- This cycle intentionally stops at the backend/data contract because `mobile/App.tsx` and `mobile/src/components/SearchScreen.tsx` are already dirty from unrelated older work. Frontend Search server-mode wiring remains a tracked P1 follow-up.

## Validation

- `npx jest --runInBand --detectOpenHandles src/__tests__/public.events.no-leak.test.ts` - pass.
- `npx tsx scripts/prove_mobile_search_event_route_contract.ts` - pass.
- `npx tsc --noEmit` - pass.
- `powershell -ExecutionPolicy Bypass -File mobile\scripts\check-mobile-audit-gate.ps1 -Cycle "Cycle JT"` - pass.

## Remaining P1

- Wire the Search tab UI to request backend search pages in server mode after the current unrelated mobile UI churn is reconciled.
- Add ranked/faceted discovery if production Search needs Polymarket-scale global discovery beyond World Cup MVP scope.

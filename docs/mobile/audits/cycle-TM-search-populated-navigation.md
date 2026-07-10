# Cycle TM - Search Populated Result Navigation Proof

Status: P0 pass on Samsung S23.

## Scope

Cycle TL proved the Search tab does not expose the removed Filter/sort UI, but the S23 proof landed in an empty Search state. This cycle closes that proof gap by requiring Search to launch with populated results, prove the no-filter/no-sort guard, and open a result row into Event Detail.

## Acceptance Criteria

| Priority | Criterion | Proof |
| --- | --- | --- |
| P0 | Search proof starts from `forceSearch=1` with reset state, not the empty `forceSearchQuery=zzzz` route. | Source contract and S23 proof. |
| P0 | Search screen shows at least one `search-result-*` row while still showing hidden no-filter/no-sort markers. | S23 XML. |
| P0 | Search screen still has no visible `Filter`, filter panel, saved filter, or sort controls. | S23 XML negative assertions. |
| P0 | Tapping a Search result opens Event Detail with Game Lines and Player Props visible. | S23 screenshot/XML. |

## Implementation Notes

- Updated `mobile/scripts/smoke.ps1` `-SearchSort` path to launch `forceResetState=1,forceSearch=1` in server market-data mode against the S23-reachable backend URL.
- The proof now waits for a populated Search row and fails if no `search-result-` marker appears.
- The proof taps the first result row and verifies Event Detail opens.
- `mobile/App.tsx` now keeps route-backed Search rows visible if quote decoration is temporarily unavailable, instead of collapsing Search to `0 results`.
- Strengthened `searchScreenContract` to guard this populated-navigation proof path.

## Backend / Data Contract

- No backend route changed.
- Search continues using the existing event feed/search path through `loadSearchEventPage`.
- Populated server-mode Search depends on `/api/events` returning at least one World Cup event with mobile market data.
- Mobile Search consumes route-backed event/market rows and treats quote decoration as non-blocking for discovery.

## Remaining Gaps

- Saved/watchlist and richer Search filters remain out of Local MVP scope.
- Search is secondary to the primary retail flow; real provider-backed line-market availability remains the main P1 provider gap.

## Proof

- PASS: `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/searchScreenContract.test.ts mobile/src/__tests__/searchResultStatsContract.test.ts mobile/src/__tests__/searchEventService.test.ts mobile/src/__tests__/deepLinkResetContract.test.ts`
- PASS: `npm run typecheck` in `mobile`.
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: Samsung S23 `SM-S911U1` deep proof with `mobile/scripts/smoke.ps1 -Deep -SearchSort`.
- S23 screenshot: `docs/mobile/screenshots/cycle-TM-search-populated-navigation/cycle-current-holiwyn-search-no-filter-sort.png`.
- S23 Event Detail screenshot: `docs/mobile/screenshots/cycle-TM-search-populated-navigation/cycle-current-holiwyn-search-open-result.png`.
- S23 XML: `docs/mobile/harness/cycle-TM-search-populated-navigation/cycle-current-holiwyn-search-sort-screen.xml`.
- S23 Event Detail XML: `docs/mobile/harness/cycle-TM-search-populated-navigation/cycle-current-holiwyn-search-open-result.xml`.

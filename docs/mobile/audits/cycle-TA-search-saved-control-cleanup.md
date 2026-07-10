# Cycle TA - Search Saved Control Cleanup

## Scope

Local MVP Search/Home navigation cleanup.

Out of scope: Event Detail, Trade Ticket, Portfolio, order routes, provider ingestion, account preference storage, Google auth, order book UI, chat, live stats, social features, deposit/withdraw, and backend schemas.

## Product Direction

The current Local MVP path is retail trading only: Home -> Event Detail -> line market -> Buy/Sell ticket -> fake-token/server-backed order -> Portfolio/history. Watchlist/saved-market behavior is not part of this milestone, so the default visible Search route should not expose bookmark controls.

## Acceptance Criteria

| Criterion | Priority | Result | Evidence |
| --- | --- | --- | --- |
| Search results no longer render bookmark/save buttons. | P0 | Pass by source/test | `mobile/src/components/SearchScreen.tsx`; `mobile/src/__tests__/searchScreenContract.test.ts`; `mobile/src/__tests__/searchResultStatsContract.test.ts` |
| Search result rows still open Event Detail through the row tap and keep the chevron affordance. | P0 | Pass by source; not populated in S23 proof | Source still calls `openEvent(event)` on the result row. S23 launch showed Search with 0 top results, so row tap was not device-proven in this cycle. |
| Home no longer accepts unused saved/watchlist props in the default MVP feed. | P1 | Pass by source/typecheck | `mobile/src/components/HomeScreen.tsx`; `mobile/App.tsx` |
| Account/profile saved preference storage is not deleted in this cycle. | P1 | Pass by source scope | `mobile/App.tsx` saved preference state remains for future account/preference work. |

## Implementation Notes

- Removed `savedEventIds` and `toggleSavedEvent` from `SearchScreen` props and App Search call site.
- Removed the visible `save-event-*` bookmark button from Search result rows.
- Removed unused saved props from `HomeScreen` and the App Home call site.
- Added contract assertions that Search does not contain bookmark/save controls.
- No API routes, database schema, provider mapping, order logic, Portfolio logic, or Google auth code changed.

## Audit Gate

Result: partial pass for device proof, pass for source/test scope.

Focused source/tests verify the Search saved-control cleanup. Samsung S23 proof reached the Search screen and confirmed no saved filter, `save-event-*`, or bookmark markers were present in XML, but the runtime showed 0 top results, so populated result-row tap was not proven on device in this cycle.

Proof summary: `docs/mobile/harness/cycle-TA-search-saved-control-cleanup/cycle-TA-search-saved-control-proof.json`.

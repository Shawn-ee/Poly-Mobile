# Cycle TL - Search Filter Removal Guard

Status: P0 partial pass for no-filter/no-sort guard.

## Scope

The current Local MVP direction keeps Search as a simple World Cup discovery surface. The user explicitly removed the Search filter button as nonessential. The actual `SearchScreen` was already clean, but older audit and smoke proof paths still treated Search filter/sort controls as expected behavior.

This cycle aligns the source contract, smoke harness, and docs with the current product direction:

- Search keeps typed query, clear, result rows, pagination, and row navigation.
- Search does not expose filter, sort, saved/watchlist, social/chat, or category controls.
- Hidden audit markers prove the controls are intentionally absent without putting debug copy in the tester UI.

## Acceptance Criteria

| Priority | Criterion | Proof |
| --- | --- | --- |
| P0 | Search screen exposes no visible `Filter` button or filter/sort panel controls. | Pass: source contract and S23 XML. |
| P0 | Query clear flow still works after the cleanup and returns to Top results. | Pass in source/harness contract; S23 proof shows clean Top results empty state without filter controls. |
| P1 | Search result rows still navigate to Event Detail. | Not re-proven in TL because the S23 proof landed in empty Search state. Existing broader Search/navigation proofs remain historical evidence. |
| P1 | Older saved/search filter smoke paths should be retired if saved/watchlist returns later under its own milestone. | Tracked as non-MVP. |

## Implementation Notes

- Added hidden `search-filter-controls-hidden-local-mvp` and `search-sort-controls-hidden-local-mvp` audit markers to `SearchScreen`.
- Strengthened `searchScreenContract` so unsupported Search filter/sort/category/saved/social controls stay absent.
- Updated `mobile/scripts/smoke.ps1` so the `SearchSort` branch now proves no filter/sort UI, rather than trying to open a removed filter panel.

## Backend / Data Contract

- No backend route changed.
- Search still depends on the existing event feed/search path and local fallback search service.
- No schema, order, Portfolio, provider, or auth state changed.

## Remaining Gaps

- Search is not part of the primary Local MVP trading path, so this cycle does not address provider-backed line-market availability.
- Result-row navigation should be re-proven the next time a Search cycle starts from a populated result feed.
- Saved/watchlist remains out of scope for the Local MVP unless a future milestone reintroduces it with a dedicated backend contract.

## Proof

- Focused Search tests: passed.
- Mobile typecheck: passed.
- Root typecheck: passed.
- Samsung S23 `SM-S911U1` no-filter proof: partial pass.
- Proof summary: `docs/mobile/harness/cycle-TL-search-filter-removal/cycle-TL-search-filter-removal-proof.json`.
- Screenshot: `docs/mobile/screenshots/cycle-TL-search-filter-removal/cycle-TL-search-no-filter.png`.
- XML: `docs/mobile/harness/cycle-TL-search-filter-removal/cycle-TL-search-no-filter.xml`.

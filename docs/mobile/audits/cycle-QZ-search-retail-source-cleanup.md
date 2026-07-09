# Cycle QZ - Search Retail Source Cleanup

## Scope

Local MVP visible cleanup for the Search result surface.

Search rows were still showing source/debug labels such as `Polymarket X markets`, `Holiwyn lines`, or mixed provider/local-line wording. These labels are useful for audit and backend migration, but they make the tester UI feel internal instead of retail. This cycle keeps the hidden source markers and removes the visible source copy.

This cycle does not change backend routes, order logic, Event Detail, Trade Ticket, Portfolio, order book, chat, live stats, social, deposit, or withdraw behavior.

## Polymarket Reference Behavior

- Search/discovery rows emphasize category, title, price/probability, and navigation.
- Provider implementation notes are not shown as visible retail row copy.
- Tapping a result should continue to open the relevant market/event detail.

## Acceptance Criteria

| ID | Priority | Criteria | Evidence |
| --- | --- | --- | --- |
| QZ-P0-01 | P0 | Search results do not visibly show source/debug copy such as `Polymarket X markets`, `Holiwyn lines`, or `Source unavailable`. | S23 XML/screenshot proof. |
| QZ-P0-02 | P0 | Search results still show the search input, result row, title, probability/outcome, save entry, and navigation affordance. | S23 XML/screenshot proof. |
| QZ-P0-03 | P0 | Search keeps hidden `search-result-source-*` markers with provider/local counts for audit. | Source contract test and S23 XML proof. |
| QZ-P0-04 | P0 | Existing unsupported Search filter/sort/category controls remain absent. | Source contract test. |
| QZ-P0-05 | P0 | No backend route, order, schema, ticket, order book, chat, live stats, social, deposit, or withdraw code changes. | Git diff and docs. |

## Implementation

- Converted Search result source readiness from visible text to a hidden accessibility/test marker.
- Updated the Search result stats contract test.

## Backend/API Contract

- No backend route changed.
- Existing Search route usage remains through the mobile service layer.
- Search still consumes `marketSourceSummary` only for hidden audit markers.

## Audit Gate

Pass.

- Typecheck passed.
- Focused Search contract tests passed.
- S23 proof device: Samsung S23 `SM-S911U1`, `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`.
- S23 proof result: Search input, Search tab, result rows, probability text, and hidden `search-result-source-*` markers were present.
- Visible debug/source text absent: `Polymarket X markets`, `Holiwyn lines`, `Source unavailable`, and `Checking source`.
- Unsupported filter/sort/category controls remained absent.

Evidence:

- XML: `docs/mobile/harness/cycle-QZ-search-retail-source-cleanup/cycle-QZ-search.xml`
- Screenshot: `docs/mobile/screenshots/cycle-QZ-search-retail-source-cleanup/cycle-QZ-search.png`

## Remaining Gaps

- Real provider-backed current-match Spread/Totals/Team Total line markets remain unavailable.

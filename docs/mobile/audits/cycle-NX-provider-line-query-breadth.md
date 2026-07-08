# Cycle NX - Provider Line Query Breadth Inspection

## Scope

Local MVP provider/data inspection for World Cup line markets. This cycle does not add orderbook UI, chat, live stats, schema changes, or ticket/order route changes.

## Reference Audit

The inspected Polymarket provider source is the public Gamma API, because the current blocker is whether Holiwyn can attach real provider-owned markets for line families.

Checked provider events:

- `fifwc-arg-egy-2026-07-07`
- `fifwc-col-gha-2026-07-03`

Observed provider state:

- Gamma exposes match-winner/Regulation Winner markets with usable market ids and condition ids.
- Gamma did not expose attach-ready Spread/Totals/Team Total markets for the checked events.
- Broad searches returned many irrelevant or wrong-family candidates; the relevance gate correctly rejected them.

## Holiwyn Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| NX-P0-01 | P0 | Provider candidate search must keep event/team/family line phrases inside the query cap. | Pass |
| NX-P0-02 | P0 | Search normalization must use the event team pair for total/spread/team-total markets, not generic Over/Under outcome labels. | Pass |
| NX-P0-03 | P0 | The relevance gate must not attach irrelevant or wrong-family candidates as provider-backed line markets. | Pass |
| NX-P0-04 | P0 | `/api/mobile/events/:slug/live-detail` must honestly disclose provider-backed winner rows versus contract-fixture line rows. | Pass |
| NX-P0-05 | P0 | S23 visible proof must show the current Local MVP Home -> Event Detail path still works with chat/orderbook hidden. | Pass |

## Implementation Summary

- `buildProviderCandidateSearchQueries()` now inserts event/team/family line phrases before lower-value fallback phrases so they survive the 12-query cap.
- `buildProviderEventSearchPhrases()` now prefers teams inferred from the event/title against the provider team-name map before using outcome labels.
- Added line-family phrases for total goals, over/under, spread, handicap, and team-total searches.
- Added a unit test proving Colombia/Ghana total-goals phrases are present within the capped query list.

## Evidence

- `docs/mobile/harness/cycle-NX-provider-line-query-breadth/cycle-NX-provider-line-source-probe.json`
- `docs/mobile/harness/cycle-NX-provider-line-query-breadth/cycle-NX-provider-match-line-availability.json`
- `docs/mobile/harness/cycle-NX-provider-line-query-breadth/cycle-NX-current-mvp-s23-visible-flow.json`
- `docs/mobile/screenshots/cycle-NX-provider-line-query-breadth/cycle-NX-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-NX-provider-line-query-breadth/cycle-NX-current-mvp-detail-stale-top.png`

## Audit Gate

Pass for the focused provider-query breadth milestone.

The cycle does not claim provider-backed line-market parity. Current service state remains:

- Regulation Winner: provider-backed by Polymarket.
- Spread/Totals/Team Total: backend-shaped contract fixtures for Local MVP.

## Remaining Gaps

- P1: Real provider-backed Spread/Totals/Team Total line markets remain unavailable for the checked Polymarket events.
- P1: Future provider rows must include stable market/outcome/token identity before replacing contract fixtures.

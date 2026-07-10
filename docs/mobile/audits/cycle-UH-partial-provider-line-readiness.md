# Cycle UH - Partial Provider Line Readiness

Status: backend/data-contract pass; no visible UI proof because no Android device was attached.

## Scope

Tighten the Local MVP line-market readiness contract so route-visible provider coverage for only one line family cannot be mistaken for full Spread/Totals/Team Total parity.

Out of scope: order book UI, chat, live stats, social/watchlist, chart UI, backend schema migrations, order route changes, and cosmetic Event Detail changes.

## Problem

`lineMarkets.status` previously became `provider-backed` as soon as any line market was provider-backed or approved-provider-backed. That was too broad for the current MVP gate: Polymarket-style line parity needs the expected MVP families to be covered, especially Spread, Total, and Team Total.

## Implementation

- Added `partial-provider-backed` for line-market summaries when some expected line families are provider-backed but others remain fixture-only or missing.
- Added `providerAvailability.status="partial"` for the same state.
- Changed `nextProviderAction` to `replace_remaining_fixture_line_families_with_provider_markets` when partial coverage exists.
- Kept full `provider-backed` status only when every expected MVP line family has provider-backed coverage.
- Added mobile hidden audit markers for partial provider line readiness while keeping the retail UI quiet.

## Acceptance Criteria

| ID | Priority | Criterion | Result |
| --- | --- | --- | --- |
| UH-P0-01 | P0 | One provider-backed line family plus fixture/missing families must not return `lineMarkets.status=provider-backed`. | Pass |
| UH-P0-02 | P0 | Partial line coverage must expose `partial-provider-backed`, `providerAvailability.status=partial`, remaining families, and next action. | Pass |
| UH-P0-03 | P0 | Full provider-backed line status is allowed only when Spread, Total, and Team Total are covered. | Pass |
| UH-P0-04 | P0 | Mobile hidden audit markers must recognize partial provider line coverage without adding visible debug labels. | Pass |

## Proof

- Backend contract: `npm run test:jest -- --runTestsByPath src/__tests__/mobile-live-event-detail.test.ts`
- Mobile contract: `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/eventDetailMarketSourceBadges.test.ts mobile/src/__tests__/worldCupAdapter.test.ts`
- Mobile typecheck: `npm run typecheck --prefix mobile --if-present`

## Remaining Gaps

- Real provider-backed current-match Spread/Totals/Team Total market ids, token ids, and quotes remain P1.
- Android proof should be rerun after a route-visible partial-provider state exists or when a device is attached for the next visual cycle.


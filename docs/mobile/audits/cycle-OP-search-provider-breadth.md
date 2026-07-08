# Cycle OP - Search Provider Breadth Visibility

Date: 2026-07-08

## Goal

Make the provider breadth runtime visible in the mobile app without changing the Home Local MVP match-only feed.

## Visible Mobile User Flow Changed

Search -> Top results.

Search result rows now show compact source/readiness copy from the backend `marketSourceSummary` contract:

- Provider-only rows show `Polymarket N markets`.
- Mixed provider/test-line rows show `Polymarket N / test lines M`.

## Backend/API Route Changed

None.

Existing route dependencies:

- `GET /api/events?sportKey=soccer&source=polymarket&includeMobileMarkets=1&limit=10`
- `GET /api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&limit=10`

## Acceptance Criteria

- P0: Search rows show source readiness from backend `marketSourceSummary`, not invented local stats.
- P0: S23 Search proof visibly includes at least two provider-backed results.
- P0: Home remains Local MVP match-only and does not reintroduce the old Futures/Home catalog.
- P0: Provider breadth route proof includes both a match event and a non-match/outright event.
- P0: No backend route/schema/order logic changes.

## Proof

Device: Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`, model `SM_S911U1`.

- Route proof: `docs/mobile/harness/cycle-OP-search-provider-breadth/cycle-OP-search-provider-breadth-route.json`
- S23 screenshot: `docs/mobile/harness/cycle-OP-search-provider-breadth/cycle-OP-s23-search-provider-breadth.png`
- S23 XML: `docs/mobile/harness/cycle-OP-search-provider-breadth/cycle-OP-s23-search-provider-breadth.xml`

Route proof result:

- Provider-backed events: 2.
- Provider-backed match events: 1.
- Provider-backed non-match/outright events: 1.
- `World Cup Winner`: 8 Polymarket-backed markets.
- `Argentina vs. Egypt`: 3 Polymarket-backed markets plus 4 contract-shaped test-line markets.

## Validation

- `npm --prefix mobile run typecheck`: pass.
- `npm run test:mobile-api -- mobile/src/__tests__/searchEventService.test.ts mobile/src/__tests__/searchScreenContract.test.ts mobile/src/__tests__/searchResultStatsContract.test.ts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/inactiveFuturesSurfaceContract.test.ts`: pass.
- `npx tsx scripts/prove_mobile_search_provider_breadth.ts --baseUrl=http://127.0.0.1:3002 --output=docs/mobile/harness/cycle-OP-search-provider-breadth/cycle-OP-search-provider-breadth-route.json`: pass.

## Result

Audit Gate: pass for Search provider breadth visibility.

Remaining gaps:

- Home intentionally remains one-match Local MVP feed.
- Spread/Totals/Team Total lines on the MVP match remain contract-shaped test fixtures until real Polymarket-backed line markets are discovered/imported.
- Provider breadth should continue expanding real attach-ready match events, not just outrights.

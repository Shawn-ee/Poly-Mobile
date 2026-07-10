# Cycle TN - Provider Line Breadth Current Matches

## Scope

Local MVP provider discovery for current World Cup-style match line markets.

This cycle does not change mobile UI, order routes, order book UI, chat, live stats, social features, deposits, withdrawals, Prisma schema, or fake-token order behavior.

## Reference Audit

Provider source:

- Polymarket Gamma `/events?slug=fifwc-arg-egy-2026-07-07`
- Polymarket Gamma `/markets` broad World Cup line search
- Holiwyn `/api/mobile/events/argentina-vs-egypt/live-detail`
- Holiwyn provider discovery service for exact event/manual slug fallback candidates

Observed Polymarket-backed data:

- Argentina vs Egypt exposes three real provider-backed Regulation Winner markets:
  - Argentina win
  - Draw
  - Egypt win
- Gamma exposes zero spread, totals, or team-total line markets for this event.
- Broad World Cup line search found zero attach-ready provider-backed line candidates across 3,773 raw candidates and 2,674 World Cup-relevant candidates.

## Acceptance Criteria

### P0

- Provider discovery must keep unrelated/winner markets from being attached as line markets.
- Current-match route proof must show real Polymarket Regulation Winner markets separately from contract-fixture line markets.
- If Gamma exposes no attach-ready line markets, Holiwyn must keep spread/totals/team-total fixtures explicitly marked as contract fixtures.
- Provider discovery must generate exact event/manual line fallback slugs for current teams before declaring line markets unavailable.

### P1

- If Polymarket later exposes attach-ready line markets, import and attach them before replacing contract fixtures.
- Keep expanding team normalization as new World Cup match teams appear.

## Implementation

Changed provider team-code normalization in `src/server/services/mobileLiveProviderCandidates.ts`.

Added coverage for current and nearby World Cup teams including:

- Egypt
- Paraguay
- Norway
- Curacao
- Cote d'Ivoire / Ivory Coast
- Costa Rica, Iran, Saudi Arabia, Serbia, South Korea, Tunisia, Wales, Peru

The change improves exact manual fallback generation for spread, total, and team-total line searches. It does not weaken the relevance gate and does not attach provider markets automatically.

## Proof

Focused tests:

- `npx jest src/__tests__/mobile-live-provider-candidates.service.test.ts --runInBand`
- Result: passed, 22 tests.

Proof files:

- `docs/mobile/harness/cycle-TN-provider-line-breadth-current-matches/cycle-TN-provider-line-breadth-scan.json`
- `docs/mobile/harness/cycle-TN-provider-line-breadth-current-matches/cycle-TN-provider-match-line-availability.json`
- `docs/mobile/harness/cycle-TN-provider-line-breadth-current-matches/cycle-TN-current-match-provider-discovery.json`
- `docs/mobile/harness/cycle-TN-provider-line-breadth-current-matches/cycle-TN-current-mvp-s23-visible-flow.json`

Key proof results:

- Broad scan: `providerLineCandidateCount=0`, `attachReadyProviderLineCandidateCount=0`.
- Current route: `realPolymarketMarketCount=3`, `contractFixtureMarketCount=4`.
- Current route: line-market `providerAvailability.status=unavailable`.
- Current discovery: `manualSlugFallbackCount=124`.
- Current discovery: `manualLineSlugFallbackCount=118`.
- Current discovery: exact Egypt line fallback slugs are generated, but Gamma returns `manualSlugFallbackCandidateCount=0`.
- Current discovery: `attachReadyLineTargetCount=0`.
- S23 visible regression proof passed on `SM-S911U1`.
- S23 proof confirms Home/Live source disclosure, Event Detail line-family readiness, provider-unavailable line-family disclosure, contract-fixture line order flow, orderbook hidden, ticket line carry-through, and Portfolio History filled trade.

## Audit Gate

Pass for the TN backend/provider scope.

The user-visible behavior made materially closer:

- Holiwyn is less likely to incorrectly conclude "no provider line market" before checking current-team exact fallback slugs.
- The backend evidence now proves the current MVP line fixtures are a provider-data limitation, not just a frontend shortcut.

Not a visible UI parity pass:

- No new visible UI behavior was introduced by this provider-only cycle because the route-visible decision remains unchanged: real winner markets plus contract-fixture line markets.
- Android proof was run as regression coverage for Home -> Event Detail -> line market -> ticket -> order -> Portfolio/history.

## Remaining Gaps

- P1: Real provider-backed spread/totals/team-total current-match lines remain unavailable from Polymarket Gamma.
- P1: Contract fixtures remain the honest Local MVP path for line-market UI/order proof until real provider line markets exist.
- P1: If real-money production needs live line pricing before Polymarket exposes it, define an approved secondary provider contract rather than inventing local-only data.

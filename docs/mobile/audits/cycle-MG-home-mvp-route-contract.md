# Cycle MG - Home MVP Match Route Contract

## Scope

Local MVP retail betting flow only:

- Home -> Event Detail -> line market -> simple Buy ticket -> fake-token/server-backed order -> Portfolio History.
- No order book UI, chat, live stats, social, watchlists, backend schema migration, or non-MVP surface work.

## Problem

The Home page was visually focused on World Cup matches, but the mobile app still had to filter generic `/api/events` results to remove non-match futures. That kept a repeated data-contract gap alive: the backend route did not explicitly expose a Local MVP match-only feed for Home.

## Acceptance Criteria

P0:

- Mobile can request a backend match-only World Cup feed with an explicit route flag.
- The route excludes futures/outrights when that flag is used.
- The route still returns compact mobile markets, `marketSourceSummary`, pagination, and source/status fields.
- Home consumes the explicit match-only feed contract.
- Search/discovery can still opt out of the World Cup league filter when needed.
- S23 proof still passes Home -> Event Detail -> Spread line -> ticket -> Portfolio History.

P1:

- Route proof records the current provider state: provider-backed Regulation Winner and `contract-fixture` line markets.
- The data-contract docs clearly state that line markets are still fixtures until attach-ready provider rows exist.

P2:

- Future backend cleanup can replace `mobileMvpMatches=1` with a dedicated `/api/mobile/home/matches` route if the product surface grows.

## Implementation

Changed:

- `src/app/api/events/route.ts`
- `src/__tests__/public.events.no-leak.test.ts`
- `mobile/src/api.ts`
- `mobile/src/services/homeEventFeedService.ts`
- `mobile/src/__tests__/api.test.ts`
- `mobile/src/__tests__/homeEventFeedService.test.ts`

Behavior:

- `/api/events?...&includeMobileMarkets=1&mobileMvpMatches=1` now applies a server-side Local MVP match filter.
- `PolyApi.listWorldCupEvents` supports `mobileMvpMatches`.
- Home sends `mobileMvpMatches: true`.
- Generic Search still passes `leagueKey: null` and does not use the match-only flag.

## Route Proof

Route proof:

- `docs/mobile/harness/cycle-MG-home-mvp-route-contract/cycle-MG-mobile-mvp-match-feed-route.json`

Result:

- `eventCount`: 2
- `futureCount`: 0
- Events:
  - `argentina-vs-egypt`
  - `switzerland-vs-colombia`
- Regulation Winner status: `provider-backed`
- Line Markets status: `contract-fixture`
- Line families: `spread`, `team_total_goals`, `total_goals`

## Android Proof

Device:

- `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model: `SM-S911U1`

S23 proof summary:

- `docs/mobile/harness/cycle-MG-home-mvp-route-contract/cycle-MG-current-mvp-s23-visible-flow.json`

Screenshots:

- `docs/mobile/screenshots/cycle-MG-home-mvp-route-contract/cycle-MG-current-mvp-home.png`
- `docs/mobile/screenshots/cycle-MG-home-mvp-route-contract/cycle-MG-current-mvp-detail-top.png`
- `docs/mobile/screenshots/cycle-MG-home-mvp-route-contract/cycle-MG-current-mvp-lines.png`
- `docs/mobile/screenshots/cycle-MG-home-mvp-route-contract/cycle-MG-current-mvp-ticket-ready.png`
- `docs/mobile/screenshots/cycle-MG-home-mvp-route-contract/cycle-MG-current-mvp-portfolio-history.png`

Result:

- Pass.

Verified:

- Home shows the two Local MVP matches, not futures/outrights.
- Event Detail opens from Home.
- Game Lines show Regulation Winner, Spread, and Totals.
- Spread `1.5` selection reaches the ticket.
- Swipe-to-buy submits a server-backed fake-token order.
- Portfolio History shows the filled Spread trade.

## Validation

- `npm run -s typecheck` from `mobile/`
- `npx jest --runInBand src/__tests__/public.events.no-leak.test.ts -t "Local MVP match-only|mobile compact markets|backend event status"`
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/api.test.ts mobile/src/__tests__/homeEventFeedService.test.ts`

## Remaining Gaps

P0:

- None for this cycle's route/Home contract scope.

P1:

- Real provider-backed Spread/Totals/Team Total rows remain unavailable for the inspected Polymarket events.
- Production liquidity still depends on future execution/liquidity design; local proof uses deterministic seeded counterparty liquidity.

P2:

- Consider replacing the flag with a dedicated mobile Home matches endpoint when the API is stabilized.

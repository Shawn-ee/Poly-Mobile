# Cycle MA - Argentina vs Egypt Line Fixtures And Detail Hydration

## Scope

Local MVP retail betting flow inspection and repair for the live match detail path:

- Home
- Event Detail
- Regulation Winner
- Spread
- Totals
- Team Total Goals
- ticket selection identity

No order book, chat, live stats, social, deposit, withdraw, or backend schema work was performed.

## Inspection Result

The local backend service is running and the mobile routes are returning usable MVP data.

`GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&limit=10` returns:

- `argentina-vs-egypt`
- `switzerland-vs-colombia`
- one future/outright record, which the mobile Home screen filters out for the Local MVP match feed.

Both live match records expose:

- provider-backed Regulation Winner markets
- backend-shaped `contract-fixture` line markets
- line families: `spread`, `total_goals`, `team_total_goals`

`GET /api/mobile/events/argentina-vs-egypt/live-detail` returns 7 markets:

- 3 `polymarket` Regulation Winner markets
- 2 `contract-fixture` Spread markets
- 1 `contract-fixture` Totals market
- 1 `contract-fixture` Team Totals market

## Diagnosis

Regulation Winner is on and provider-backed for the current Local MVP live matches.

Spread/Totals/Team Total markets are not provider-backed yet. They are backend-shaped `contract-fixture` rows because the current Polymarket Gamma inspection did not expose attach-ready soccer line markets for the selected match. This is acceptable for Local MVP UI/order proof, but it is not final provider parity.

The visible S23 issue was that the Event Detail hydration path did not have an explicit slug field in the mobile `Event` contract. The app could fall back to compact Home-card data or stale Expo bundle state during proof. The cycle now preserves `slug` during backend normalization and hydrates detail with `event.slug ?? event.id`.

## Implementation

Files touched:

- `scripts/seed_mobile_mvp_match_line_markets.ts`
- `scripts/inspect_mobile_mvp_current_state.ts`
- `mobile/App.tsx`
- `mobile/src/adapters/worldCupAdapter.ts`
- `mobile/src/mocks/worldCup.ts`
- `mobile/src/__tests__/worldCupAdapter.test.ts`
- `mobile/src/__tests__/eventDetailHydrationContract.test.ts`

Behavior changes:

- `argentina-vs-egypt` now has the same Local MVP line-market families as `switzerland-vs-colombia`.
- The mobile adapter classifies structured backend line market types as `game-line` before title heuristics can classify World Cup text as `future`.
- Backend-normalized mobile events now preserve `slug`.
- Event Detail hydration now requests the full backend detail route by `event.slug ?? event.id`.
- The current-state inspection harness now has a real `fs` import and supports the cycle label.

## Android Proof

Device:

- Samsung S23 `adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp`
- Model `SM-S911U1`

Proof files:

- `docs/mobile/screenshots/cycle-MA-argentina-egypt-line-fixtures/home-after-hydration-fix.png`
- `docs/mobile/screenshots/cycle-MA-argentina-egypt-line-fixtures/argentina-egypt-detail-after-reopen-slug-hydration.png`
- `docs/mobile/screenshots/cycle-MA-argentina-egypt-line-fixtures/argentina-egypt-detail-lower-lines-after-slug-hydration.png`
- `docs/mobile/harness/cycle-MA-argentina-egypt-line-fixtures/argentina-egypt-detail-after-reopen-slug-hydration.xml`
- `docs/mobile/harness/cycle-MA-argentina-egypt-line-fixtures/argentina-egypt-detail-lower-lines-after-slug-hydration.xml`

S23 proof confirms:

- Home shows the live match card for `argentina-vs-egypt`.
- Event Detail reports `7 markets / 14 outcomes`.
- Spread is visible with selectable line values `0.5` and `1.5`.
- Spread outcome rows preserve `selection-market-type-spread`, line, period, source, provider/fixture ids, and token identity.
- Totals is visible with `Over 2.5` and `Under 2.5`.
- Team Total Goals is visible with line `1.5`.
- Totals and Team Total rows preserve backend-shaped `contract-fixture` selection identity.

## Validation

- `npm run -s typecheck` from `mobile/`
- `npx vitest run --config vitest.mobile.config.mts mobile/src/__tests__/worldCupAdapter.test.ts mobile/src/__tests__/eventDetailHydrationContract.test.ts`
- `npm run -s mobile:mvp:inspect -- --cycle=MA --summaryPath=docs/mobile/harness/cycle-MA-argentina-egypt-line-fixtures/cycle-MA-current-state-after-second-match-lines.json`

## Remaining Gaps

P0 for this cycle:

- None unresolved for visible line-market availability on the Argentina vs Egypt detail page.

P1:

- Replace `contract-fixture` line markets with real provider-backed line markets when Polymarket or another approved provider exposes attach-ready rows.
- Prove Home -> Event Detail -> line ticket -> fake-token/server order -> Portfolio/history on S23 using the now-visible Argentina/Egypt line market.

P2:

- Improve chart history freshness for this match; current route still reports no provider chart history points for these line markets.
